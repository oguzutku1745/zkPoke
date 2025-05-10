/* tests/instagram.test.ts */

import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

import { createProver, generateCircuitInputs } from '../src/helpers';

import type { CompiledCircuit } from '@noir-lang/noir_js';
import type { Prover } from '@zkpersona/noir-helpers';

/* ACIR JSON (nargo compile → target/instagram_example.json) */
import circuit from '../target/instagram_example.json' assert { type: 'json' };

/* Skip tests based on environment variables */
const skipPlonkProving = false; // Default to running all tests
const skipHonkProving = false;  // Default to running all tests

describe('Instagram email verification', () => {
  let prover: Prover;
  // The correct recipient email from the test file
  const RECIPIENT_EMAIL = 'yildirim.mesude11@gmail.com';
  // The expected username to verify
  const INSTAGRAM_USERNAME = 'denemedeneme581';

  
  beforeAll(() => {
    // Initialize prover
    prover = createProver(circuit as CompiledCircuit, { type: 'all' });
  });

  it.skipIf(skipHonkProving)('proves DKIM, email hash, and username (honk backend)', async () => {
    const eml = fs.readFileSync(path.join('data', 'instagram-valid.eml'));
    
    // Generate circuit inputs for both email and username verification
    const inputs = await generateCircuitInputs(eml, RECIPIENT_EMAIL, INSTAGRAM_USERNAME);
    
    // Generate proof that: 
    // 1. Email has valid DKIM signature from Instagram
    // 2. The email is addressed to the claimed recipient (verified by hash)
    // 3. The username in the email matches the expected username (verified by hash)
    const proof = await prover.fullProve(inputs, { type: 'honk' });
    const verified = await prover.verify(proof, { type: 'honk' });
    
    console.log('Proof outputs:', proof.publicInputs);
    expect(verified).toBe(true);
  });

  it.skipIf(skipPlonkProving)('proves DKIM, email hash, and username (plonk backend)', async () => {
    const eml = fs.readFileSync(path.join('data', 'instagram-valid.eml'));

    // Same inputs for both backends
    const inputs = await generateCircuitInputs(eml, RECIPIENT_EMAIL, INSTAGRAM_USERNAME);

    const proof = await prover.fullProve(inputs, { type: 'plonk' });
    const verified = await prover.verify(proof, { type: 'plonk' });
    
    console.log('Proof outputs:', proof.publicInputs);
    expect(verified).toBe(true);
  });
});
  