import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Contract, Fr, AztecAddress } from '@aztec/aztec.js';
import { CredentialNote } from '../utils/tree-utils';
import { deployerEnv } from '../config';

// Helper for serializing BigInt values when using JSON.stringify
function replacer(key: string, value: any) {
  // Check if the value is a BigInt
  if (typeof value === 'bigint') {
    return {
      type: 'bigint',
      value: value.toString()
    };
  }
  return value;
}

// Helper for deserializing BigInt values from JSON.parse
function reviver(key: string, value: any) {
  if (value && value.type === 'bigint' && typeof value.value === 'string') {
    return BigInt(value.value);
  }
  return value;
}

interface ContractContextType {
  contract: Contract | null;
  setContract: (contract: Contract | null) => void;
  credentials: CredentialNote[];
  setCredentials: (credentials: CredentialNote[]) => void;
  root: Fr | null;
  setRoot: (root: Fr | null) => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

const STORAGE_KEY = 'zkpoke_contract_address';
const CREDENTIALS_KEY = 'zkpoke_credentials';
const ROOT_KEY = 'zkpoke_root';

export function ContractProvider({ children }: { children: ReactNode }) {
  const [contract, setContractState] = useState<Contract | null>(null);
  const [credentials, setCredentialsState] = useState<CredentialNote[]>([]);
  const [root, setRootState] = useState<Fr | null>(null);

  // Load contract from localStorage when component mounts
  useEffect(() => {
    const loadContract = async () => {
      const storedAddress = localStorage.getItem(STORAGE_KEY);
      
      if (storedAddress && !contract) {
        try {
          // Create a new instance of the contract using the stored address
          const { PrivateRegisterContract } = await import('../../artifacts/PrivateRegister');
          const contractAddress = AztecAddress.fromString(storedAddress);
          const wallet = await deployerEnv.getWallet();
          
          const contractInstance = await PrivateRegisterContract.at(contractAddress, wallet);
          setContractState(contractInstance);
          console.log('Contract restored from localStorage:', contractInstance.address.toString());
        } catch (error) {
          console.error('Error restoring contract from localStorage:', error);
          localStorage.removeItem(STORAGE_KEY); // Clear invalid data
        }
      }
    };
    
    loadContract();
    
    // Load credentials from localStorage
    try {
      const storedCredentials = localStorage.getItem(CREDENTIALS_KEY);
      if (storedCredentials) {
        // Use the custom reviver function to restore BigInt values
        const parsedCredentials = JSON.parse(storedCredentials, reviver);
        setCredentialsState(parsedCredentials);
        console.log('Credentials restored from localStorage');
      }
    } catch (error) {
      console.error('Error loading credentials from localStorage:', error);
      localStorage.removeItem(CREDENTIALS_KEY);
    }
    
    // Load root from localStorage
    try {
      const storedRoot = localStorage.getItem(ROOT_KEY);
      if (storedRoot) {
        const rootValue = new Fr(BigInt(storedRoot));
        setRootState(rootValue);
        console.log('Root restored from localStorage');
      }
    } catch (error) {
      console.error('Error loading root from localStorage:', error);
      localStorage.removeItem(ROOT_KEY);
    }
  }, []);

  // Custom setter that also saves to localStorage
  const setContract = (newContract: Contract | null) => {
    if (newContract) {
      localStorage.setItem(STORAGE_KEY, newContract.address.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setContractState(newContract);
  };
  
  // Custom setter for credentials that also saves to localStorage
  const setCredentials = (newCredentials: CredentialNote[]) => {
    try {
      // Use the custom replacer function to handle BigInt values
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(newCredentials, replacer));
    } catch (error) {
      console.error('Error saving credentials to localStorage:', error);
    }
    setCredentialsState(newCredentials);
  };
  
  // Custom setter for root that also saves to localStorage
  const setRoot = (newRoot: Fr | null) => {
    if (newRoot) {
      localStorage.setItem(ROOT_KEY, newRoot.toBigInt().toString());
    } else {
      localStorage.removeItem(ROOT_KEY);
    }
    setRootState(newRoot);
  };

  return (
    <ContractContext.Provider
      value={{
        contract,
        setContract,
        credentials,
        setCredentials,
        root,
        setRoot
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}

export function useContractContext() {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContractContext must be used within a ContractProvider');
  }
  return context;
} 