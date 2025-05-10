/* -------------------------------------------------------------------------- */
/*  zkPoke integration test – mirrors style of the PrivateRegister example    */
/* -------------------------------------------------------------------------- */

// Run it with: aztec-nargo compile && aztec codegen ./target -o artifacts && tsc && node dist/simulator_zkpoke

import { getInitialTestAccountsWallets } from '@aztec/accounts/testing';
import { createLogger, waitForPXE, createPXEClient, Fr, computeAuthWitMessageHash, AztecAddress } from '@aztec/aztec.js';
import { poseidon2Hash } from '@aztec/foundation/crypto';
import { randomBytes } from 'crypto';

// ────────────────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────────────────

/** Convenience wrapper – convert JS value to Fr the same way the SDK does. */
const F = (x: bigint | number | string) => new Fr(BigInt(x));

/* ────────────────────────────────────────────────────────────────────────── */
/*  helpers for FieldCompressedString                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/* 1️⃣  the decode helper (you just posted)  */
interface NoirFieldCompressedString {
  value: bigint;
}
export const readFieldCompressedString = (
  field: NoirFieldCompressedString,
): string => {
  const bytes = Array.from(new Fr(field.value).toBuffer());
  let out = '';
  for (const b of bytes) if (b !== 0) out += String.fromCharCode(b);
  return out;
};

/* 2️⃣  the *encode* counterpart – turn a JS string into a single Field (=bigint) */
export const stringToField = (txt: string): Fr => {
  /* compress to UTF-8 then pad to 31 bytes exactly like FieldCompressedString does */
  const bytes = Buffer.from(txt, 'utf8');
  if (bytes.length > 31)
    throw new Error(`string too long for FieldCompressedString (max 31 bytes)`);
  const padded = Buffer.concat([bytes, Buffer.alloc(31 - bytes.length)]);
  return new Fr(padded);
};


/** Re-create `poseidon2(poke_note.to_fields())` off-chain so we know the commitment key. */
async function hashPokeNote(raw: {
  receiver: bigint;
  sender:   bigint;
  igHash:   bigint;
  f0:       bigint;     // masked instagram-id (0 or value)
  f1:       bigint;     // masked full-name
  f2:       bigint;     // masked partial-name
  f3:       bigint;     // masked nationality
}) {
  const fieldArr = [
    F(raw.receiver),
    F(raw.sender),
    F(raw.igHash),
    F(raw.f0),
    F(raw.f1),
    F(raw.f2),
    F(raw.f3),
  ];

  console.log(fieldArr)
  const h = await poseidon2Hash(fieldArr);
  return new Fr(h).toBigInt();
}


/** Bring PXE up exactly like in the first test. */
const setupSandbox = async () => {
  const { PXE_URL = 'http://localhost:8080' } = process.env;
  const pxe = await createPXEClient(PXE_URL);
  await waitForPXE(pxe);
  return pxe;
};

// ────────────────────────────────────────────────────────────────────────────
// main test flow
// ────────────────────────────────────────────────────────────────────────────
async function main() {
  let pxe;
  let wallets = [];
  let nodes = [];
  let log;
  log = createLogger('aztec:aztec-starter');
  pxe = await setupSandbox();
  const [alice, bob] = await getInitialTestAccountsWallets(pxe);   // two actors

  /* 1. deploy contract */
  const { ZkPokeContract } = await import('../artifacts/ZkPoke');
  console.log(ZkPokeContract)
  const contract = await ZkPokeContract.deploy(alice).send().deployed();
  log.info(`zkPoke deployed at ${contract.address}`);

  const NULLIFIER_A = F(111n);

  const ALICE_IG = 'alice.eth';
  const BOB_IG   = 'bob.eth';

  console.log(alice)
  console.log(bob)

  let alice_regs_public = await contract.methods
  .register(ALICE_IG)
  .send()
  .wait();

  let bob_regs_public = await contract
  .withWallet(bob)
  .methods
  .register(BOB_IG)
  .send()
  .wait();

  let alice_regs = await contract.methods
  .register_info(ALICE_IG, 'Alice Wonderland', 'Alice W.', 'TR')
  .send()
  .wait();

  console.log(alice_regs)

  await contract
    .withWallet(bob)
    .methods
    .register_info(BOB_IG, 'Bob Builder', 'Bob B.', 'US')
    .send()
    .wait();

  log.info('✅ both users registered');


  const rand_1 = BigInt('0x' + randomBytes(31).toString('hex'));
  const MASK_NAT_ONLY = 0b1000;          // 8  ← bit-3
  const igHash = new Fr(await poseidon2Hash([stringToField(ALICE_IG)]));
  let alice_address = await contract.methods.get_address(igHash).simulate();

  await contract
    .withWallet(bob)
    .methods
    .poke(ALICE_IG, alice_address , rand_1, 0o1)
    .send()
    .wait();

  log.info('✅ Bob poked Alice');

  const aliceAddr = await alice.getAddress();
  const bobAddr   = await bob.getAddress();

    const fields_manual = [
    F(aliceAddr.toBigInt()),
    F(bobAddr.toBigInt()),
    F(stringToField(ALICE_IG).toBigInt()),
    F(stringToField(BOB_IG).toBigInt()),
    F(0n),
    F(0n),
    F(0n),
    F(rand_1),
  ];

  const manualHash = new Fr(await poseidon2Hash(fields_manual)).toBigInt();  

  const commitment = await contract.methods.create_commitment(manualHash).send().wait();
  const get_intention = await contract.methods.get_intention(manualHash).simulate();
  console.log("INTENTION IS: ");
  console.log(get_intention);

  const pokeNotes = await contract
  .methods
  .trial(aliceAddr, bobAddr)   // utility you added
  .simulate();
  const n = pokeNotes.storage[0];               // first note

  console.log("Alice's address:",aliceAddr);
  console.log(n)

  // 2) build the exact field array
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
const commitHash = new Fr(await poseidon2Hash(fields)).toBigInt();



console.log(commitHash == manualHash)

// 4) call respond_poke with that hash
await contract
  .withWallet(alice)
  .methods
  .respond_poke(commitHash, 1, bobAddr)
  .send()
  .wait();

  const pokes = await contract.methods.get_pokes(aliceAddr, 0).simulate();
  console.log('Alice’s pokes (page-0):', pokes);

  const update_intention = await contract.methods.update_commitment(commitHash,1).send().wait();
  console.log(update_intention)

}



main().catch((err) => {
  console.error(err);
  process.exit(1);
});
