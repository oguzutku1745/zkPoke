import { useState } from 'react';
import { Fr } from '@aztec/aztec.js';
import { toast } from 'react-toastify';
import { deployerEnv } from '../config';
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

export function useZkPoke() {
  const [wait, setWait] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [userRegistered, setUserRegistered] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  
  const deploy = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    setWait(true);
    const wallet = await deployerEnv.getWallet();
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
      const result = await toast.promise(
        contractToUse.methods.register(instagramId).send().wait(),
        {
          pending: `Registering ${instagramId}...`,
          success: 'Registration successful',
          error: 'Registration failed',
        }
      );

      console.log('Registration result:', result);
      setUserRegistered(true);
      return result;
    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('Registration failed');
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
      const result = await toast.promise(
        contractToUse.methods
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
      setUserInfo({
        instagramId,
        fullName,
        partialName,
        nationality,
      });
      
      return result;
    } catch (error) {
      console.error('Error registering user info:', error);
      toast.error('User info registration failed');
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

  return {
    wait,
    contract,
    userRegistered,
    userInfo,
    deploy,
    register,
    registerInfo,
    getAddressByInstagram,
  };
} 