import { useState, useEffect } from 'react';
import { Fr } from '@aztec/aztec.js';
import { toast } from 'react-toastify';
import { deployerEnv, getSelectedUser, userWallets } from '../config';
import { AztecAddress } from '@aztec/aztec.js';
import { poseidon2Hash } from '@aztec/foundation/crypto';

// Helper function to convert a string to Field format for FieldCompressedString
export const stringToField = (txt: string): Fr => {
  const bytes = Buffer.from(txt, 'utf8');
  if (bytes.length > 31)
    throw new Error(`string too long for FieldCompressedString (max 31 bytes)`);
  const padded = Buffer.concat([bytes, Buffer.alloc(31 - bytes.length)]);
  return new Fr(padded);
};

// Helper to read FieldCompressedString back to normal string
export const readFieldCompressedString = (field: { value: bigint }): string => {
  const bytes = Array.from(new Fr(field.value).toBuffer());
  let out = '';
  for (const b of bytes) if (b !== 0) out += String.fromCharCode(b);
  return out;
};

// Storage keys
const CONTRACT_ADDRESS_KEY = 'zkPokeContractAddress';
const USER_REGISTERED_KEY = 'zkPokeUserRegistered';
const USER_INFO_KEY = 'zkPokeUserInfo';

export function useZkPoke() {
  const [wait, setWait] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [userRegistered, setUserRegistered] = useState(() => {
    // Initialize from localStorage
    const storedValue = localStorage.getItem(USER_REGISTERED_KEY);
    return storedValue ? JSON.parse(storedValue) : false;
  });
  const [userInfo, setUserInfo] = useState<any>(() => {
    // Initialize from localStorage
    const storedInfo = localStorage.getItem(USER_INFO_KEY);
    return storedInfo ? JSON.parse(storedInfo) : null;
  });
  
  // Get the current selected user
  const selectedUser = getSelectedUser();
  const walletIndex = userWallets[selectedUser as keyof typeof userWallets]?.index || 0;
  
  // Effect to connect to existing contract on mount
  useEffect(() => {
    const connectToExistingContract = async () => {
      try {
        // Check if we have a stored contract address
        const storedAddress = localStorage.getItem(CONTRACT_ADDRESS_KEY);
        if (!storedAddress) return;
        
        // Import the ZkPokeContract
        const { ZkPokeContract } = await import('../../artifacts/ZkPoke');
        
        // Get the wallet for the current user
        const wallet = await deployerEnv.getWallet(walletIndex);
        
        // Connect to the existing contract
        const contractAddress = AztecAddress.fromString(storedAddress);
        const existingContract = await ZkPokeContract.at(contractAddress, wallet);
        
        if (existingContract) {
          console.log("Connected to existing ZkPoke contract at:", contractAddress.toString());
          setContract(existingContract);
        }
      } catch (error) {
        console.error("Error connecting to stored contract:", error);
        // If there's an error connecting, clear the stored address
        localStorage.removeItem(CONTRACT_ADDRESS_KEY);
      }
    };
    
    if (!contract) {
      connectToExistingContract();
    }
  }, [walletIndex, selectedUser]);
  
  // Update localStorage when userRegistered changes
  useEffect(() => {
    localStorage.setItem(USER_REGISTERED_KEY, JSON.stringify(userRegistered));
  }, [userRegistered]);
  
  // Update localStorage when userInfo changes
  useEffect(() => {
    if (userInfo) {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    }
  }, [userInfo]);
  
  const deploy = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    setWait(true);
    const wallet = await deployerEnv.getWallet(walletIndex);
    const salt = Fr.random();

    try {
      const { ZkPokeContract } = await import('../../artifacts/ZkPoke');

      const tx = await ZkPokeContract.deploy(wallet).send({
        contractAddressSalt: salt,
      });
      
      const deployedContract = await toast.promise(tx.deployed(), {
        pending: 'Deploying ZkPoke contract...',
        success: {
          render: ({ data }: any) => `ZkPoke deployed at: ${data.address}`,
        },
        error: 'Error deploying ZkPoke contract',
      });

      // Store the contract address in localStorage
      localStorage.setItem(CONTRACT_ADDRESS_KEY, deployedContract.address.toString());
      
      setContract(deployedContract);
      console.log("ZkPoke contract deployed", deployedContract);
      return deployedContract;
    } catch (error) {
      console.error('Error deploying ZkPoke contract:', error);
      toast.error('Error deploying ZkPoke contract');
      return null;
    } finally {
      setWait(false);
    }
  };

  const register = async (instagramId: string, directContract?: any) => {
    // Use the passed contract if available, otherwise use the state contract
    const contractToUse = directContract || contract;
    
    if (!contractToUse) {
      toast.error('ZkPoke contract not deployed yet');
      return;
    }

    setWait(true);
    try {
      const wallet = await deployerEnv.getWallet(walletIndex);
      
      try {
        // First simulate the transaction to check for potential errors
        await contractToUse.withWallet(wallet).methods.register(instagramId).simulate();
      } catch (simulateError: any) {
        console.error('Simulation error:', simulateError);
        const errorMessage = simulateError.message || '';
        
        if (errorMessage.includes('already initialized') || 
            errorMessage.includes('PublicImmutable already initialized')) {
          console.log(`User ${instagramId} is already registered`);
          toast.info('User is already registered');
          setUserRegistered(true);
          setWait(false);
          return;
        }
        throw simulateError;
      }
      
      const result = await toast.promise(
        contractToUse.withWallet(wallet).methods.register(instagramId).send().wait(),
        {
          pending: `Registering ${instagramId}...`,
          success: 'Registration successful',
          error: 'Registration failed',
        }
      );

      console.log('Registration result:', result);
      setUserRegistered(true);
      return result;
    } catch (error: any) {
      console.error('Error during registration:', error);
      // Provide more specific error messages
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('already initialized') || 
          errorMessage.includes('PublicImmutable already initialized')) {
        console.log(`User ${instagramId} is already registered`);
        toast.info('User is already registered');
        setUserRegistered(true);
      } else if (errorMessage.includes('Cannot satisfy constraint')) {
        toast.error('Registration failed: Constraint error. Check wallet permissions.');
      } else {
        toast.error(`Registration failed: ${errorMessage.slice(0, 100)}`);
      }
    } finally {
      setWait(false);
    }
  };

  const registerInfo = async (
    instagramId: string,
    fullName: string,
    partialName: string,
    nationality: string,
    directContract?: any
  ) => {
    const contractToUse = directContract || contract;
    
    if (!contractToUse) {
      toast.error('ZkPoke contract not deployed yet');
      return;
    }

    setWait(true);
    try {
      const wallet = await deployerEnv.getWallet(walletIndex);
      
      try {
        // First simulate the transaction to check for potential errors
        await contractToUse.withWallet(wallet).methods
          .register_info(instagramId, fullName, partialName, nationality)
          .simulate();
      } catch (simulateError: any) {
        console.error('Simulation error:', simulateError);
        const errorMessage = simulateError.message || '';
        
        if (errorMessage.includes('already initialized') || 
            errorMessage.includes('PublicImmutable already initialized')) {
          console.log(`User info for ${instagramId} is already registered`);
          toast.info('User info is already registered');
          // Still update the UI state with user info
          const newUserInfo = {
            instagramId,
            fullName,
            partialName,
            nationality,
          };
          setUserInfo(newUserInfo);
          setWait(false);
          return;
        }
        
        if (errorMessage.includes('Cannot satisfy constraint')) {
          console.error('Cannot satisfy constraint error:', simulateError);
          toast.error('Registration failed: Constraint error. You may not have permission to register this user.');
          setWait(false);
          return;
        }
        
        throw simulateError;
      }
      
      const result = await toast.promise(
        contractToUse.withWallet(wallet).methods
          .register_info(instagramId, fullName, partialName, nationality)
          .send()
          .wait(),
        {
          pending: 'Registering user info...',
          success: 'User info registered successfully',
          error: 'User info registration failed',
        }
      );

      console.log('User info registration result:', result);
      const newUserInfo = {
        instagramId,
        fullName,
        partialName,
        nationality,
      };
      setUserInfo(newUserInfo);
      
      return result;
    } catch (error: any) {
      console.error('Error registering user info:', error);
      // Provide more specific error messages
      const errorMessage = error.message || '';
      
      if (errorMessage.includes('already initialized') || 
          errorMessage.includes('PublicImmutable already initialized')) {
        console.log(`User info for ${instagramId} is already registered`);
        toast.info('User info is already registered');
        // Still update the UI state with user info
        const newUserInfo = {
          instagramId,
          fullName,
          partialName,
          nationality,
        };
        setUserInfo(newUserInfo);
      } else if (errorMessage.includes('Cannot satisfy constraint')) {
        toast.error('User info registration failed: Constraint error. You may not have permission to register this user.');
      } else if (errorMessage.includes('Existing nullifier')) {
        toast.error('User info registration failed: Transaction already processed.');
      } else {
        toast.error(`User info registration failed: ${errorMessage.slice(0, 100)}`);
      }
    } finally {
      setWait(false);
    }
  };

  // Get user address by instagram ID
  const getAddressByInstagram = async (instagramId: string) => {
    if (!contract) {
      toast.error('ZkPoke contract not deployed yet');
      return null;
    }

    try {
      // Hash the Instagram ID
      const igField = stringToField(instagramId);
      const igHash = new Fr(await poseidon2Hash([igField]));
      
      // Get the address from the contract
      const addressResult = await contract.methods.get_address(igHash).simulate();
      return addressResult;
    } catch (error) {
      console.error('Error getting address by Instagram ID:', error);
      toast.error('Failed to get address');
      return null;
    }
  };

  // Reset contract and user data (for testing/development)
  const resetContractData = () => {
    localStorage.removeItem(CONTRACT_ADDRESS_KEY);
    localStorage.removeItem(USER_REGISTERED_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    setContract(null);
    setUserRegistered(false);
    setUserInfo(null);
    toast.info("Contract data reset. Refresh the page to start over.");
  };

  // Check if a user is already registered
  const isUserRegistered = async (instagramId: string, directContract?: any): Promise<boolean> => {
    const contractToUse = directContract || contract;
    
    if (!contractToUse) {
      return false;
    }

    try {
      // Hash the Instagram ID
      const igField = stringToField(instagramId);
      const igHash = new Fr(await poseidon2Hash([igField]));
      
      // Get the address from the contract
      const addressResult = await contractToUse.methods.get_address(igHash).simulate();
      
      // Check if addressResult is valid and not zero
      if (!addressResult) {
        return false;
      }
      
      // Check if it's an AztecAddress with the equals method
      if (typeof addressResult === 'object' && addressResult !== null && 'equals' in addressResult) {
        return !addressResult.equals(AztecAddress.ZERO);
      }
      
      // If it's a string, convert it to AztecAddress first
      if (typeof addressResult === 'string') {
        try {
          const address = AztecAddress.fromString(addressResult);
          return !address.equals(AztecAddress.ZERO);
        } catch (e) {
          console.error('Error converting string to AztecAddress:', e);
          return false;
        }
      }
      
      // For any other type, check if it's truthy (not null, undefined, 0, empty string, etc.)
      return !!addressResult;
    } catch (error) {
      console.error('Error checking if user is registered:', error);
      return false;
    }
  };

  return {
    wait,
    contract,
    userRegistered,
    userInfo,
    deploy,
    register,
    registerInfo,
    getAddressByInstagram,
    resetContractData,
    selectedUser,
    isUserRegistered,
  };
} 