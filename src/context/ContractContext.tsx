import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Contract, Fr } from '@aztec/aztec.js';
import { CredentialNote } from '../utils/tree-utils';

interface ContractContextType {
  contract: Contract | null;
  setContract: (contract: Contract | null) => void;
  credentials: CredentialNote[];
  setCredentials: (credentials: CredentialNote[]) => void;
  root: Fr | null;
  setRoot: (root: Fr | null) => void;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export function ContractProvider({ children }: { children: ReactNode }) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [credentials, setCredentials] = useState<CredentialNote[]>([]);
  const [root, setRoot] = useState<Fr | null>(null);

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