import { useState } from 'react';
import { Fr, AztecAddress } from '@aztec/aztec.js';
import { toast } from 'react-toastify';
import { deployerEnv } from '../config';
import { poseidon2Hash } from '@aztec/foundation/crypto';
import { readFieldCompressedString, stringToField } from './useZkPoke';

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
}

// Helper to convert bigint to Fr (like in the test script)
const F = (x: bigint | number | string) => new Fr(BigInt(x));

export function useSignals() {
  const [wait, setWait] = useState(false);
  const [sentSignals, setSentSignals] = useState<PokeNote[]>([]);
  const [receivedSignals, setReceivedSignals] = useState<PokeNote[]>([]);

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
    message: string,
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
      const wallet = await deployerEnv.getWallet();
      const userAddress = await wallet.getAddress();
      
      // Get current timestamp
      const timestamp = new Date().toISOString();
      
      // Send the poke using the contract
      const result = await toast.promise(
        contract.methods
          .poke(receiverInstagramId, receiverAddress, mask)
          .send()
          .wait(),
        {
          pending: 'Sending signal...',
          success: 'Signal sent successfully!',
          error: 'Failed to send signal',
        }
      );

      console.log('Send signal result:', result);
      
      // Create a signal object to store in localStorage
      const sentSignal: PokeNote = {
        owner: receiverAddress.toBigInt(),
        sender: userAddress.toBigInt(),
        instagram_id_receiver: { value: stringToField(receiverInstagramId).toBigInt() },
        instagram_id_sender: { value: 0n }, // We don't know the sender's Instagram ID in this context
        full_name: { value: 0n },
        partial_name: { value: 0n },
        nationality: { value: 0n },
        randomness: 0n,
        timestamp,
        message,
        exposureMask: mask,
      };
      
      // Store in localStorage
      const storedSignals = JSON.parse(localStorage.getItem('sentSignals') || '[]');
      storedSignals.push({
        ...sentSignal,
        receiverInstagramId, // Store readable version for easy display
      });
      localStorage.setItem('sentSignals', JSON.stringify(storedSignals));
      
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
      const wallet = await deployerEnv.getWallet();
      const userAddress = await wallet.getAddress();
      
      const page = 0; // First page of results
      
      // Get pokes from the contract
      const result = await contract.methods.get_pokes(userAddress, page).simulate();
      
      console.log('Received signals:', result);
      
      // Filter out empty notes and add timestamps
      const signals = result.storage
        .slice(0, Number(result.len))
        .filter((note: PokeNote) => note.owner !== 0n)
        .map((note: PokeNote) => ({
          ...note,
          timestamp: new Date().toISOString(), // For newly fetched notes, use current time
          read: true, // Assume all retrieved notes are read
          replied: false // Initially not replied
        }));
      
      setReceivedSignals(signals);
      
      return signals;
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
    const signals = JSON.parse(localStorage.getItem('sentSignals') || '[]');
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
      const wallet = await deployerEnv.getWallet();
      
      // Calculate the commit hash exactly as in the test script
      const fields = [
        F(note.owner),
        F(note.sender),
        F(note.instagram_id_receiver.value),
        F(note.instagram_id_sender.value),
        F(note.full_name.value),
        F(note.partial_name.value),
        F(note.nationality.value),
        F(note.randomness)
      ];
      
      // Match the test script's approach for computing the commit hash
      const commitHash = new Fr(await poseidon2Hash(fields)).toBigInt();
      
      // Create AztecAddress from sender bigint using AztecAddress constructor
      const senderAddress = AztecAddress.fromBigInt(note.sender);
      
      // Call respond_poke
      const result = await toast.promise(
        contract.methods
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
      await contract.methods.update_commitment(commitHash, intention).send().wait();
      
      // Update the note in state
      const updatedSignals = receivedSignals.map(signal => 
        signal.randomness === note.randomness
          ? { ...signal, replied: true, intention }
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

  return {
    wait,
    sentSignals,
    receivedSignals,
    sendSignal,
    getReceivedSignals,
    getSentSignals,
    respondToSignal,
    pokeNoteToReadable
  };
} 