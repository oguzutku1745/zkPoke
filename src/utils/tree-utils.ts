import { Fr } from "@aztec/aztec.js";
import { poseidon2Hash } from '@aztec/foundation/crypto';

/** Convert a bit-packed path (e.g. 0b010) into [u8; 5] */
export function indexBitsToArray(index: number, maxDepth = 5): number[] {
  const arr: number[] = [];
  for (let i = 0; i < maxDepth; i++) {
    arr.push((index >> i) & 1);   // take the i-th bit
  }
  return arr;
}

export interface CredentialNote {
  owner: bigint;
  claim_type: bigint;
  claim_hash: bigint;
  randomness: bigint;
}

export async function hashCredentialNote(raw: CredentialNote): Promise<bigint> {
  const fieldArr = [
    new Fr(raw.owner),
    new Fr(raw.claim_type),
    new Fr(raw.claim_hash),
    new Fr(raw.randomness),
  ];

  const hashResult = await poseidon2Hash(fieldArr);
  const resultBigInt = await new Fr(hashResult).toBigInt();
  return resultBigInt;
} 