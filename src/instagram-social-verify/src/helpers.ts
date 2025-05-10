import type { CompiledCircuit } from '@noir-lang/noir_js';
import { generateEmailVerifierInputs } from '@zk-email/zkemail-nr';
import { Prover, type ProvingBackend } from '@zkpersona/noir-helpers';
import { Fr } from "@aztec/aztec.js";

export const circuitParams = {
  instagram: {
    maxHeadersLength: 576,
    maxBodyLength: 16384,
    extractFrom: true,
    extractTo: true,
  },
} as const;

export type CircuitType = keyof typeof circuitParams;
export type CircuitInputMap = { instagram: any };   // kod jenerasyonu sonrası güncellenecek

export const createProver = (circuit: CompiledCircuit, backend: ProvingBackend) =>
  new Prover(circuit, backend);

// Simple hash function to match the Noir implementation
// We simply sum the bytes multiplied by their position (i+1)
function simpleHash(data: Uint8Array): bigint {
  let sum = BigInt(0);
  for (let i = 0; i < data.length; i++) {
    sum += BigInt(data[i]) * BigInt(i + 1);
  }
  return sum;
}

// Function to extract Instagram username from email
function extractUsernameFromEmail(emailContent: string): string {
  // Look for a greeting pattern like "Merhaba denemedeneme581,"
  const usernameMatch = emailContent.match(/Merhaba ([^,]+),/);
  
  if (usernameMatch && usernameMatch[1]) {
    console.log(`Found username in greeting: ${usernameMatch[1]}`);
    return usernameMatch[1];
  }
  
  // If pattern not found, try alternative method
  // Look for text that might contain the username in the footer section
  const footerMatch = emailContent.match(/adresine ([^\s]+) i.in g.nderilmi.tir/);
  
  if (footerMatch && footerMatch[1]) {
    console.log(`Found username in footer: ${footerMatch[1]}`);
    return footerMatch[1];
  }
  
  throw new Error("Could not extract Instagram username from email");
}

export async function generateCircuitInputs(
  eml: Buffer | string,
  expectedToAddress: string,      // Email address input
  expectedUsername?: string,      // Optional username input (if not provided, extract from email)
) {
  // Convert buffer to string if needed for username extraction
  const emlString = typeof eml === 'string' ? eml : eml.toString('utf8');
  
  // Get the basic inputs from the email
  const base = await generateEmailVerifierInputs(
    eml,
    circuitParams.instagram,
  );

  // Calculate hash of the expected email address
  const textEncoder = new TextEncoder();
  const emailData = textEncoder.encode(expectedToAddress);
  const emailHash = simpleHash(emailData);
  
  // Extract username from email
  const extractedUsername = extractUsernameFromEmail(emlString);
  // Use provided username or fall back to extracted username
  const claimedUsername = expectedUsername || extractedUsername;
  
  // Calculate hash of both usernames
  const extractedUsernameData = textEncoder.encode(extractedUsername);
  const extractedUsernameHash = simpleHash(extractedUsernameData);
  
  const claimedUsernameData = textEncoder.encode(claimedUsername);
  const claimedUsernameHash = simpleHash(claimedUsernameData);
  
  console.log('Expected email:', expectedToAddress);
  console.log('Email hash value:', emailHash.toString());
  console.log('Extracted Instagram username:', extractedUsername);
  console.log('Claimed username:', claimedUsername);
  console.log('Extracted username hash:', extractedUsernameHash.toString());
  console.log('Claimed username hash:', claimedUsernameHash.toString());
  
  // Log warning if usernames don't match
  if (claimedUsername !== extractedUsername) {
    console.warn(`WARNING: Claimed username "${claimedUsername}" doesn't match extracted username "${extractedUsername}"`);
    console.warn('This will cause the proof to fail.');
  }
  
  // Convert hashes to field format
  const emailHashField = Fr.fromString(emailHash.toString());
  const extractedUsernameHashField = Fr.fromString(extractedUsernameHash.toString());
  const claimedUsernameHashField = Fr.fromString(claimedUsernameHash.toString());
  
  // Noir "main" arguments - passing both username hashes as separate parameters
  return {
    ...base,
    expected_to_hash: emailHashField.toString(),
    extracted_username_hash: extractedUsernameHashField.toString(),
    expected_username_hash: claimedUsernameHashField.toString()
  };
}