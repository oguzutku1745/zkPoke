
// Run it with: aztec-nargo compile && aztec codegen ./target -o artifacts && tsc && node dist/simulator

import { getInitialTestAccountsWallets } from "@aztec/accounts/testing";
import { createLogger, waitForPXE, createPXEClient, Fr } from "@aztec/aztec.js";
import LeanIMT from '../lean-imt-await/lean-imt-await'; 
import { BatchCall } from '@aztec/aztec.js';          // same package that exports Wallet
import { poseidon2Hash } from '@aztec/foundation/crypto';

/** Convert a bit-packed path (e.g. 0b010) into [u8; 5] */
function indexBitsToArray(index: number, maxDepth = 5): number[] {
  const arr: number[] = [];
  for (let i = 0; i < maxDepth; i++) {
    arr.push((index >> i) & 1);   // take the i-th bit
  }
  return arr;
}


const F = (x:any) => new Fr(BigInt(x));

async function hashCredentialNote(raw:{
  owner: bigint,
  claim_type:bigint,
  claim_hash:bigint,
  randomness:bigint
}) {
  const fieldArr = [
    F(raw.owner),
    F(raw.claim_type),
    F(raw.claim_hash),
    F(raw.randomness),
  ];

  const hashResult = await poseidon2Hash(fieldArr);
  const resultBigInt = await new Fr(hashResult).toBigInt()
  return resultBigInt;
}

const setupSandbox = async () => {
  const { PXE_URL = 'http://localhost:8080' } = process.env;
  const pxe = await createPXEClient(PXE_URL);
  await waitForPXE(pxe);
  return pxe;
};


async function main() {
  let pxe;
  let wallets = [];
  let nodes = [];
  let logger;
  logger = createLogger('aztec:aztec-starter');
  pxe = await setupSandbox();
  wallets = await getInitialTestAccountsWallets(pxe);
  const { PrivateRegisterContract } = await import('../artifacts/PrivateRegister');
  const contract = await PrivateRegisterContract.deploy(wallets[1]).send().deployed();
  logger.info(`Contract deployed at: ${contract.address}`);



  const calls = [
    contract.methods.init_credential_note(0),  // ← returns BaseContractInteraction
    contract.methods.init_credential_note(1),
    contract.methods.init_credential_note(2),
    contract.methods.init_credential_note(3),
  ];
  
  const calls2 = [
    contract.methods.init_credential_note(4),
    contract.methods.init_credential_note(5),
    contract.methods.init_credential_note(6),
    contract.methods.init_credential_note(7),
  ]

  const batch = new BatchCall(wallets[1], calls);
  const batch2 = new BatchCall(wallets[1], calls2);

  const simResult = await batch.simulate();   // returns an array of return-values (if any)
  console.log('simulation:', simResult);
  const simResult2 = await batch2.simulate();   // returns an array of return-values (if any)
  console.log('simulation:', simResult2);

  const sentTx = batch.send();                // returns SentTx
  const sentTx2 = batch2.send();                // returns SentTx
  await sentTx.wait();                        // blocks until mined / settled
  await sentTx2.wait();                        // blocks until mined / settled
  console.log('✅ batch mined at', (await sentTx.getReceipt()).blockHash);
  console.log('✅ batch mined at', (await sentTx2.getReceipt()).blockHash);

  // Get credential notes
  const all_credentials_init = await contract.methods.read_all_credentials(wallets[1].getAddress()).simulate();

  const leaves_init: bigint[] = await Promise.all(
    all_credentials_init.storage                     // 10-slot ring buffer
      .slice(0, Number(all_credentials_init.len))    // keep the first `len` valid notes
      .filter((n : any) => n.owner !== 0n)  // drop empty placeholder entries
      .map((note:any) => hashCredentialNote(note)),
  );

  const tree_init = new LeanIMT();            // ← no argument ⇒ built-in hash (Fr)

  // convert every leaf to Fr BEFORE inserting
  await tree_init.insertMany(leaves_init.map(v => new Fr(v)));
  
  // Verify we have the right depth
  console.log("Tree Root:", tree_init.root);
  console.log("Tree Depth:", tree_init.depth);  // Should be 3
  console.log("Tree Size:", tree_init.size);  

  // Update the verification root in the contract
  const _tx_init = await contract.methods.update_verification_root(tree_init.root).send().wait();
  console.log("Root in contract:", (await contract.methods.read_root(wallets[1].getAddress()).simulate()).root);

  const proof_init = tree_init.generateProof(0);
  console.log("Merkle Proof for Note Init:");
  console.log("- Leaf:", proof_init.leaf);
  console.log("- Index:", proof_init.index);
  console.log("- Siblings:", proof_init.siblings);

  const paddedSiblings_init: (Fr | bigint)[] = [
    ...proof_init.siblings,
    ...Array(5 - proof_init.siblings.length).fill(Fr.ZERO),   // or 0n
  ];
  
  // ---- build a 5-element indices array --------------------------
  const bitPath_init       = indexBitsToArray(proof_init.index);   // ↙ your helper
  const paddedIndices_init = [
    ...bitPath_init,
    ...Array(5 - bitPath_init.length).fill(0),
  ];
  

  // Verify using the contract
  try {
    const verifyTx = await contract.methods.verify_note_in_merkle_tree(
      0, // claim_type for the first note
      paddedSiblings_init, // siblings (padded to length 5)
      paddedIndices_init, // flipped and padded indices to match contract's convention
      tree_init.root // expected root
    ).send().wait();
    
    console.log("Verification transaction successful:", verifyTx);
  } catch (error) {
    console.error("Verification failed:", error);
  }

// ###################******************#################******************#######################

  const _tx_add_cred = await contract.methods.add_credential_note(1,1234).send().wait();
  console.log(_tx_add_cred)

  const all_credentials = await contract.methods.read_all_credentials(wallets[1].getAddress()).simulate();
  console.log("All Credentials:", all_credentials)
  

  const leaves: bigint[] = await Promise.all(
    all_credentials.storage                     // 10-slot ring buffer
      .slice(0, Number(all_credentials.len))    // keep the first `len` valid notes
      .filter((n : any) => n.owner !== 0n)  // drop empty placeholder entries
      .map((note:any) => hashCredentialNote(note)),
  );

  const tree = new LeanIMT();            // ← no argument ⇒ built-in hash (Fr)

  // convert every leaf to Fr BEFORE inserting
  await tree.insertMany(leaves.map(v => new Fr(v)));
  
  // Verify we have the right depth
  console.log("Tree Root:", tree.root);
  console.log("Tree Depth:", tree.depth);  // Should be 3
  console.log("Tree Size:", tree.size);  

  // Update the verification root in the contract
  const _tx9 = await contract.methods.update_verification_root(tree.root).send().wait();
  console.log("Root in contract:", (await contract.methods.read_root(wallets[1].getAddress()).simulate()).root);
  
  const proof0 = tree.generateProof(0);
  console.log("Merkle Proof for Note 0:");
  console.log("- Leaf:", proof0.leaf);
  console.log("- Index:", proof0.index);
  console.log("- Siblings:", proof0.siblings);

  const paddedSiblings: (Fr | bigint)[] = [
    ...proof0.siblings,
    ...Array(5 - proof0.siblings.length).fill(Fr.ZERO),   // or 0n
  ];
  
  // ---- build a 5-element indices array --------------------------
  const bitPath       = indexBitsToArray(proof0.index);   // ↙ your helper
  const paddedIndices = [
    ...bitPath,
    ...Array(5 - bitPath.length).fill(0),
  ];
  

  // Verify using the contract
  try {
    const verifyTx = await contract.methods.verify_note_in_merkle_tree(
      0, // claim_type for the first note
      paddedSiblings, // siblings (padded to length 5)
      paddedIndices, // flipped and padded indices to match contract's convention
      tree.root // expected root
    ).send().wait();
    
    console.log("Verification transaction successful:", verifyTx);
  } catch (error) {
    console.error("Verification failed:", error);
  }
  
  const creds = await contract
  .methods
  .read_all_credentials(wallets[1].getAddress())
  .simulate();

// 2. rebuild the tree exactly as you do now
const leaves_final = await Promise.all(
  creds.storage
    .slice(0, Number(creds.len))
    .filter((n:any) => n.owner !== 0n)
    .map(hashCredentialNote),
);
const tree_final = new LeanIMT();
await tree_final.insertMany(leaves_final.map(v => new Fr(v)));

// 3. find the *slot* whose claim_type === 1
const idx = creds.storage
  .slice(0, Number(creds.len))
  .findIndex((n:any) => n.claim_type === 1n);

if (idx === -1) throw new Error('claim_type 1 not found');

// 4. build the proof for that slot
const proof = tree.generateProof(idx);
const siblings = [
  ...proof.siblings,
  ...Array(5 - proof.siblings.length).fill(Fr.ZERO),
];
const bits = indexBitsToArray(proof.index, tree.depth);
const indices = [...bits, ...Array(5 - bits.length).fill(0)];
// 5. verification call

  try {
    await contract.methods
      .verify_note_in_merkle_tree(1, siblings, indices, tree.root)
      .send()
      .wait();
    console.log('second-note verification succeeded');
  } catch (error) {
    console.error("Verification of second note failed:", error);
  }
}

main().catch(console.error);