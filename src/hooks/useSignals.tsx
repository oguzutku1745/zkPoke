import { useState } from 'react';
import { Fr, AztecAddress } from '@aztec/aztec.js';
import { toast } from 'react-toastify';
import { deployerEnv, getSelectedUser, userWallets } from '../config';
import { poseidon2Hash } from '@aztec/foundation/crypto';
import { readFieldCompressedString, stringToField } from './useZkPoke';
import { randomBytes } from 'crypto';

// Interface for a poke note
export interface PokeNote {
  owner: bigint;
  sender: bigint;
  instagram_id_receiver: { value: bigint };
  instagram_id_sender: { value: bigint };
  full_name: { value: bigint };
  partial_name: { value: bigint };
  nationality: { value: bigint };
  randomness: bigint;
  timestamp?: string; // Additional field for UI display
  read?: boolean;
  replied?: boolean;
  intention?: number;
  message?: string; // Message content
  exposureMask?: number; // Mask for exposed fields
  receiverInstagramId?: string; // Plain text Instagram ID
  commitHash?: bigint; // Optional commitment hash
}

// Short alias for Fr constructor
const F = (value: bigint | number) => new Fr(value);
const bigintReplacer = (_: string, value: any) =>
  typeof value === 'bigint' ? value.toString() : value;

const bigintReviver = (_: string, value: any) =>
  typeof value === 'string' && /^[0-9]+$/.test(value) ? BigInt(value) : value;

export function useSignals() {
  const [wait, setWait] = useState(false);
  const [sentSignals, setSentSignals] = useState<PokeNote[]>([]);
  const [receivedSignals, setReceivedSignals] = useState<PokeNote[]>([]);

  // Get the current selected user
  const selectedUser = getSelectedUser();
  const walletIndex = userWallets[selectedUser as keyof typeof userWallets]?.index || 0;

  // Helper function to get localStorage key with user namespace
  const getSentSignalsKey = () => `sentSignals_${selectedUser}`;

  // Convert PokeNote object to a readable format
  const pokeNoteToReadable = (note: PokeNote) => {
    if (!note || note.owner === 0n) return null;
    
    return {
      ...note,
      instagram_id_receiver_text: readFieldCompressedString(note.instagram_id_receiver),
      instagram_id_sender_text: readFieldCompressedString(note.instagram_id_sender),
      full_name_text: readFieldCompressedString(note.full_name),
      partial_name_text: readFieldCompressedString(note.partial_name),
      nationality_text: readFieldCompressedString(note.nationality),
    };
  };

  // Send a poke (signal) to another user
  const sendSignal = async (
    receiverInstagramId: string,
    receiverAddress: AztecAddress,
    exposureOptions: { [key: string]: boolean },
    contract: any
  ) => {
    if (!contract) {
      toast.error('Contract not deployed or initialized');
      return null;
    }

    // Convert exposure options to a mask
    // bit-0 = ig, bit-1 = full name, bit-2 = partial name, bit-3 = nationality
    let mask = 0;
    if (exposureOptions.instagramId) mask |= 0b0001;
    if (exposureOptions.fullName) mask |= 0b0010;
    if (exposureOptions.partialName) mask |= 0b0100;
    if (exposureOptions.nationality) mask |= 0b1000;

    setWait(true);
    
    try {
      const wallet = await deployerEnv.getWallet(walletIndex);
      const userAddress = await wallet.getAddress();
      
      // Get current timestamp
      const timestamp = new Date().toISOString();
      
      // Generate randomness for the poke
      const randomness = BigInt('0x' + randomBytes(31).toString('hex'));
      
      // Send the poke using the contract with randomness
      const result = await toast.promise(
        contract.withWallet(wallet).methods
          .poke(receiverInstagramId, receiverAddress, randomness, mask)
          .send()
          .wait(),
        {
          pending: 'Sending signal...',
          success: 'Signal sent successfully!',
          error: 'Failed to send signal',
        }
      );

      console.log('Send signal result:', result);
      
      // Use the trial function to get the exact note details from the contract
      const pokeNotes = await contract.methods.trial(receiverAddress, userAddress).simulate();
      console.log("Poke notes from trial for sent signal:", pokeNotes);
      
      if (!pokeNotes.storage || !pokeNotes.storage[0] || pokeNotes.storage[0].owner === 0n) {
        console.error("Could not find the note in the contract");
        toast.error("Could not verify signal. Please try again.");
        return null;
      }
      
      // Get the note with correct field values from the contract
      const note = pokeNotes.storage[0];
      console.log("Note from contract for commit hash:", note);
      
      // Use the exact contract note fields to calculate the hash
      const fields = [
        F(note.owner),
        F(note.sender),
        F(note.instagram_id_receiver.value),
        F(note.instagram_id_sender.value),
        F(note.full_name.value),
        F(note.partial_name.value),
        F(note.nationality.value),
        F(note.randomness),
      ];
      
      // Calculate the commit hash using the exact contract values
      const commitHash = new Fr(await poseidon2Hash(fields)).toBigInt();
      console.log("Calculated commit hash for sent signal (using contract note):", commitHash);
      
      // Create commitment in the contract
      await contract.withWallet(wallet).methods
        .create_commitment(commitHash)
        .send()
        .wait();
      
      console.log("Created commitment for sent signal");
      
      // Create a signal object to store in localStorage
      const sentSignal: PokeNote = {
        owner: note.owner,
        sender: note.sender,
        instagram_id_receiver: note.instagram_id_receiver,
        instagram_id_sender: note.instagram_id_sender,
        full_name: note.full_name,
        partial_name: note.partial_name,
        nationality: note.nationality,
        randomness: note.randomness,
        timestamp,
        exposureMask: mask,
        commitHash // Store the correctly calculated hash
      };
      
      // Store in localStorage with commitment hash - using user-specific key
      const storedSignals = JSON.parse(
        localStorage.getItem(getSentSignalsKey()) || '[]',
        bigintReviver
      );
      storedSignals.push({
        ...sentSignal,
        receiverInstagramId, // Store readable version for easy display
      });
      localStorage.setItem(
        getSentSignalsKey(),
        JSON.stringify(storedSignals, bigintReplacer)
      );
      
      // Update state
      setSentSignals(prevSignals => [...prevSignals, sentSignal]);
      
      return result;
    } catch (error) {
      console.error('Error sending signal:', error);
      toast.error('Error sending signal');
      return null;
    } finally {
      setWait(false);
    }
  };

  // Get signals (pokes) sent to the current user
  const getReceivedSignals = async (contract: any) => {
    if (!contract) {
      toast.error('Contract not deployed or initialized');
      return [];
    }

    setWait(true);
    
    try {
      const wallet = await deployerEnv.getWallet(walletIndex);
      const userAddress = await wallet.getAddress();
      
      const page = 0; // First page of results
      
      // Get pokes from the contract using the updated approach
      const result = await contract.methods.get_pokes(userAddress, page).simulate();
      
      console.log('Received signals:', result);
      
      // Process signals and check their intention status
      const processedSignals = [];
      
      // Filter out empty notes and process each note
      for (let i = 0; i < Number(result.len); i++) {
        const note = result.storage[i];
        
        if (note && note.owner !== 0n) {
          try {
            // Get sender address for this note
            const senderAddress = AztecAddress.fromBigInt(note.sender);
            
            // Use trial to get the exact note structure as stored in the contract
            // This ensures the hash calculation is consistent
            const pokeNotes = await contract.methods.trial(userAddress, senderAddress).simulate();
            let commitHash = 0n;
            
            if (pokeNotes.storage && pokeNotes.storage[0] && pokeNotes.storage[0].owner !== 0n) {
              // Use the contract note to calculate the hash
              const contractNote = pokeNotes.storage[0];
              
              const fields = [
                F(contractNote.owner),
                F(contractNote.sender),
                F(contractNote.instagram_id_receiver.value),
                F(contractNote.instagram_id_sender.value),
                F(contractNote.full_name.value),
                F(contractNote.partial_name.value),
                F(contractNote.nationality.value),
                F(contractNote.randomness),
              ];
              
              commitHash = new Fr(await poseidon2Hash(fields)).toBigInt();
              console.log("Calculated commit hash from contract note:", commitHash);
            } else {
              // Fallback: Build the fields array for hashing from the note itself
              const fields = [
                F(note.owner),
                F(note.sender),
                F(note.instagram_id_receiver.value),
                F(note.instagram_id_sender.value),
                F(note.full_name.value),
                F(note.partial_name.value),
                F(note.nationality.value),
                F(note.randomness),
              ];
              
              commitHash = new Fr(await poseidon2Hash(fields)).toBigInt();
              console.log("Calculated commit hash from note fields:", commitHash);
            }
            
            // Get the intention status
            const intention = Number(await contract.methods.get_intention(commitHash).simulate());
            console.log(`Intention for signal from ${senderAddress.toString()}: ${intention}`);
            
            // Add processed note to the array
            processedSignals.push({
              ...note,
              timestamp: new Date().toISOString(),
              read: true,
              replied: intention > 0,
              intention: intention,
              commitHash: commitHash
            });
          } catch (error) {
            console.error('Error processing received signal:', error);
            // Add the note without intention info
            processedSignals.push({
              ...note,
              timestamp: new Date().toISOString(),
              read: true,
              replied: false,
              intention: 0
            });
          }
        }
      }
      
      setReceivedSignals(processedSignals);
      return processedSignals;
    } catch (error) {
      console.error('Error fetching received signals:', error);
      toast.error('Error fetching signals');
      return [];
    } finally {
      setWait(false);
    }
  };

  // Get signals (pokes) sent by the current user (from localStorage)
  const getSentSignals = () => {
    // Use the user-specific key
    const signals = JSON.parse(
      localStorage.getItem(getSentSignalsKey()) || '[]',
      bigintReviver,
    ) as PokeNote[];
    
    setSentSignals(signals);
    return signals;
  };

  // Respond to a signal with an intention (1 = accept, 2 = reject)
  const respondToSignal = async (
    note: PokeNote,
    intention: number,
    contract: any
  ) => {
    if (!contract) {
      toast.error('Contract not deployed or initialized');
      return null;
    }

    if (![1, 2].includes(intention)) {
      toast.error('Invalid intention. Must be 1 (accept) or 2 (reject)');
      return null;
    }

    setWait(true);
    
    try {
      const wallet = await deployerEnv.getWallet(walletIndex);
      const userAddress = await wallet.getAddress();
      const senderAddress = AztecAddress.fromBigInt(note.sender);
      
      // Use the trial function to get the poke note with the correct format
      const pokeNotes = await contract.methods.trial(userAddress, senderAddress).simulate();
      console.log("Poke notes from trial:", pokeNotes);
      
      let commitHash = 0n;
      
      // Make sure we have valid note data
      if (pokeNotes.storage && pokeNotes.storage[0] && pokeNotes.storage[0].owner !== 0n) {
        const n = pokeNotes.storage[0];
        const fields = [
          F(n.owner),
          F(n.sender),
          F(n.instagram_id_receiver.value),
          F(n.instagram_id_sender.value),
          F(n.full_name.value),
          F(n.partial_name.value),
          F(n.nationality.value),
          F(n.randomness),
        ];

        commitHash = new Fr(await poseidon2Hash(fields)).toBigInt();
        console.log("Responding with calculated commitHash:", commitHash);
      } else {
        // Fallback to the provided note if contract note is not available
        const fields = [
          F(note.owner),
          F(note.sender),
          F(note.instagram_id_receiver.value), 
          F(note.instagram_id_sender.value),
          F(note.full_name.value),
          F(note.partial_name.value),
          F(note.nationality.value),
          F(note.randomness),
        ];
        
        commitHash = new Fr(await poseidon2Hash(fields)).toBigInt();
        console.log("Responding with fallback commitHash:", commitHash);
      }
      
      // Call respond_poke with that hash
      const result = await toast.promise(
        contract.withWallet(wallet).methods
          .respond_poke(commitHash, intention, senderAddress)
          .send()
          .wait(),
        {
          pending: 'Responding to signal...',
          success: 'Response sent successfully!',
          error: 'Failed to respond to signal',
        }
      );
      
      // Update the intention
      await contract.withWallet(wallet).methods.update_commitment(commitHash, intention).send().wait();
      
      // Update the note in state with the correct hash and intention
      const updatedSignals = receivedSignals.map(signal => 
        signal.randomness === note.randomness
          ? { ...signal, replied: true, intention, commitHash }
          : signal
      );
      
      setReceivedSignals(updatedSignals);
      
      return result;
    } catch (error) {
      console.error('Error responding to signal:', error);
      toast.error('Error responding to signal');
      return null;
    } finally {
      setWait(false);
    }
  };

  // Check the intention status of a signal by calculating its hash and querying the contract
  const getSignalIntention = async (
    note: PokeNote,
    contract: any
  ) => {
    if (!contract) {
      console.error('Contract not initialized');
      return 0;
    }
    
    try {
      // If note has sender and owner, get the exact note from contract using trial
      if (note.sender && note.owner) {
        try {
          const senderAddress = AztecAddress.fromBigInt(note.sender);
          const receiverAddress = AztecAddress.fromBigInt(note.owner);
          
          // Use trial to get the exact note structure as stored in the contract
          const pokeNotes = await contract.methods.trial(receiverAddress, senderAddress).simulate();
          
          if (pokeNotes.storage && pokeNotes.storage[0] && pokeNotes.storage[0].owner !== 0n) {
            // Use the contract note to calculate the hash
            const contractNote = pokeNotes.storage[0];
            
            const fields = [
              F(contractNote.owner),
              F(contractNote.sender),
              F(contractNote.instagram_id_receiver.value),
              F(contractNote.instagram_id_sender.value),
              F(contractNote.full_name.value),
              F(contractNote.partial_name.value),
              F(contractNote.nationality.value),
              F(contractNote.randomness),
            ];
            
            const commitHash = new Fr(await poseidon2Hash(fields)).toBigInt();
            console.log("getSignalIntention: Calculated commit hash from contract note:", commitHash);
            
            // Get the intention using this hash
            const intention = await contract.methods.get_intention(commitHash).simulate();
            console.log(`getSignalIntention: Intention for signal from ${senderAddress.toString()}: ${intention}`);
            
            return Number(intention);
          }
        } catch (err) {
          console.error("Error getting note from contract:", err);
          // Continue with fallback methods
        }
      }
      
      // If we already have a commitHash, use it directly
      if (note.commitHash) {
        console.log("getSignalIntention: Using stored commitHash:", note.commitHash);
        const intention = await contract.methods.get_intention(note.commitHash).simulate();
        console.log("getSignalIntention: Intention from stored commitHash:", intention);
        return Number(intention);
      }
      
      // Fallback: Build the fields array for hashing from the note itself
      const fields = [
        F(note.owner),
        F(note.sender),
        F(note.instagram_id_receiver.value),
        F(note.instagram_id_sender.value),
        F(note.full_name.value),
        F(note.partial_name.value),
        F(note.nationality.value),
        F(note.randomness),
      ];
      
      // Calculate the commit hash
      const commitHash = new Fr(await poseidon2Hash(fields)).toBigInt();
      console.log("getSignalIntention: Calculated commit hash from note fields:", commitHash);
      
      // Get the intention from the contract
      const intention = await contract.methods.get_intention(commitHash).simulate();
      console.log("getSignalIntention: Intention from calculated hash:", intention);
      
      return Number(intention);
    } catch (error) {
      console.error('Error checking signal intention:', error);
      return 0; // Default to 0 (pending) on error
    }
  };

  return {
    wait,
    sentSignals,
    receivedSignals,
    sendSignal,
    getReceivedSignals,
    getSentSignals,
    respondToSignal,
    getSignalIntention,
    pokeNoteToReadable,
    selectedUser,
  };
} 