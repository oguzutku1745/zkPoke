import { useState } from 'react';
import { Fr, BatchCall } from '@aztec/aztec.js';
import { toast } from 'react-toastify';
import { deployerEnv } from '../config';
import LeanIMT from '../../lean-imt-await/lean-imt-await';
import { hashCredentialNote, indexBitsToArray, CredentialNote } from '../utils/tree-utils';
import { useContractContext } from '../context/ContractContext';

export function usePrivateRegister() {
  const [wait, setWait] = useState(false);
  const [tree, setTree] = useState<LeanIMT | null>(null);
  
  // Use the global contract context instead of local state
  const { 
    contract, 
    setContract, 
    credentials, 
    setCredentials,
    root,
    setRoot
  } = useContractContext();
  
  const deploy = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    setWait(true);
    const wallet = await deployerEnv.getWallet();
    const salt = Fr.random();

    try {
      const { PrivateRegisterContract } = await import('../../artifacts/PrivateRegister');

      const tx = await PrivateRegisterContract.deploy(wallet).send({
        contractAddressSalt: salt,
      });
      const deployedContract = await toast.promise(tx.deployed(), {
        pending: 'Deploying contract...',
        success: {
          render: ({ data }: any) => `Address: ${data.address}`,
        },
        error: 'Error deploying contract',
      });

      setContract(deployedContract);
      console.log("Contract deployed", deployedContract);
      return deployedContract;
    } catch (error) {
      console.error('Error deploying contract:', error);
      toast.error('Error deploying contract');
      return null;
    } finally {
      setWait(false);
    }
  };

  const initCredentialNotes = async (directContract?: any) => {
    // Use the passed contract if available, otherwise use the context contract
    const contractToUse = directContract || contract;
    
    if (!contractToUse) {
      toast.error('Contract not deployed yet');
      console.log("Contract object is null", contractToUse);
      return;
    }

    setWait(true);
    const wallet = await deployerEnv.getWallet();

    try {
      // Create batch calls for initializing credential notes 0-7
      const calls1 = [
        contractToUse.methods.init_credential_note(0),
        contractToUse.methods.init_credential_note(1),
        contractToUse.methods.init_credential_note(2),
        contractToUse.methods.init_credential_note(3),
      ];
      
      const calls2 = [
        contractToUse.methods.init_credential_note(4),
        contractToUse.methods.init_credential_note(5),
        contractToUse.methods.init_credential_note(6),
        contractToUse.methods.init_credential_note(7),
      ];

      const batch1 = new BatchCall(wallet, calls1);
      const batch2 = new BatchCall(wallet, calls2);

      await toast.promise(
        (async () => {
          await batch1.send().wait();
          await batch2.send().wait();
        })(),
        {
          pending: 'Initializing credential notes...',
          success: 'Credential notes initialized',
          error: 'Error initializing credential notes',
        }
      );

      // Update the credentials state
      return await getAllCredentials(contractToUse);
    } catch (error) {
      console.error('Error initializing credential notes:', error);
      toast.error('Error initializing credential notes');
    } finally {
      setWait(false);
    }
  };

  const getAllCredentials = async (directContract?: any) => {
    // Use the passed contract if available, otherwise use the context contract
    const contractToUse = directContract || contract;
    
    if (!contractToUse) {
      toast.error('Contract not deployed yet');
      console.log("Contract object is null", contractToUse);
      return;
    }

    setWait(true);
    const wallet = await deployerEnv.getWallet();

    try {
      const result = await contractToUse.methods.read_all_credentials(wallet.getAddress()).simulate();
      
      // Extract valid credentials
      const validCredentials = result.storage
        .slice(0, Number(result.len))
        .filter((note: any) => note.owner !== 0n);
      
      setCredentials(validCredentials);
      
      return validCredentials;
    } catch (error) {
      console.error('Error getting credentials:', error);
      toast.error('Error getting credentials');
      return [];
    } finally {
      setWait(false);
    }
  };

  const initializeTree = async (directContract?: any, directCredentials?: CredentialNote[]) => {
    // Use the passed parameters if available, otherwise use the context values
    const contractToUse = directContract || contract;
    const credentialsToUse = directCredentials || credentials;
    
    if (!contractToUse || credentialsToUse.length === 0) {
      toast.error('Contract not deployed or no credentials available');
      return;
    }

    setWait(true);
    try {
      // Hash all credential notes
      const leaves: bigint[] = await Promise.all(
        credentialsToUse.map(hashCredentialNote)
      );

      // Create a new tree and insert the leaves
      const newTree = new LeanIMT();
      await newTree.insertMany(leaves.map(v => new Fr(v)));
      
      setTree(newTree);
      setRoot(newTree.root);

      // Update the verification root in the contract
      const wallet = await deployerEnv.getWallet();
      await toast.promise(
        contractToUse.methods.update_verification_root(newTree.root).send().wait(),
        {
          pending: 'Updating verification root...',
          success: 'Verification root updated',
          error: 'Error updating verification root',
        }
      );

      return newTree;
    } catch (error) {
      console.error('Error initializing tree:', error);
      toast.error('Error initializing tree');
      return null;
    } finally {
      setWait(false);
    }
  };

  const verifyCredential = async (claimType: number) => {
    if (!contract || !root) {
      toast.error('Contract not deployed or tree not initialized');
      return;
    }

    setWait(true);
    try {
      // First, get the latest credentials from the contract
      const wallet = await deployerEnv.getWallet();
      const result = await contract.methods.read_all_credentials(wallet.getAddress()).simulate();
      
      // Extract valid credentials
      const currentCredentials = result.storage
        .slice(0, Number(result.len))
        .filter((note: any) => note.owner !== 0n);
      
      // Find the exact index of the credential with the specified claim type
      const idx = result.storage
        .slice(0, Number(result.len))
        .findIndex((note: any) => note.claim_type === BigInt(claimType));
      
      if (idx === -1) {
        toast.error(`Credential with claim type ${claimType} not found`);
        return false;
      }
      
      console.log(`Found credential with claim type ${claimType} at index ${idx}`);
      
      // Rebuild the tree with current credentials
      const leaves: bigint[] = await Promise.all(
        currentCredentials.map(hashCredentialNote)
      );
      
      const currentTree = new LeanIMT();
      await currentTree.insertMany(leaves.map(v => new Fr(v)));
      
      // Generate proof for the credential at the correct index
      const proof = currentTree.generateProof(idx);
      
      // Prepare siblings and indices arrays
      const paddedSiblings = [
        ...proof.siblings,
        ...Array(5 - proof.siblings.length).fill(Fr.ZERO),
      ];
      
      const bitPath = indexBitsToArray(proof.index, currentTree.depth);
      const paddedIndices = [
        ...bitPath,
        ...Array(5 - bitPath.length).fill(0),
      ];
      
      // Verify using the contract with the current root
      const currentRoot = currentTree.root;
      await toast.promise(
        contract.methods.verify_note_in_merkle_tree(
          claimType,
          paddedSiblings,
          paddedIndices,
          currentRoot
        ).send().wait(),
        {
          pending: 'Verifying credential...',
          success: 'Credential verified',
          error: 'Error verifying credential',
        }
      );
      
      // Update state with latest data
      setTree(currentTree);
      setRoot(currentRoot);
      setCredentials(currentCredentials);
      
      return true;
    } catch (error) {
      console.error('Error verifying credential:', error);
      toast.error('Error verifying credential');
      return false;
    } finally {
      setWait(false);
    }
  };

  const addCredential = async (claimType: number, claimHash: number) => {
    if (!contract) {
      toast.error('Contract not deployed yet');
      return;
    }

    setWait(true);
    try {
      const wallet = await deployerEnv.getWallet();
      
      // Add the credential note
      await toast.promise(
        contract.methods.add_credential_note(claimType, claimHash).send().wait(),
        {
          pending: 'Adding credential...',
          success: 'Credential added',
          error: 'Error adding credential',
        }
      );
      
      // Update credentials and tree
      const updatedCredentials = await getAllCredentials();
      if (updatedCredentials && updatedCredentials.length > 0) {
        await initializeTree();
      }
      
      return true;
    } catch (error) {
      console.error('Error adding credential:', error);
      toast.error('Error adding credential');
      return false;
    } finally {
      setWait(false);
    }
  };

  return { 
    deploy, 
    contract, 
    wait,
    initCredentialNotes,
    getAllCredentials,
    initializeTree,
    verifyCredential,
    addCredential,
    credentials,
    tree,
    root
  };
} 