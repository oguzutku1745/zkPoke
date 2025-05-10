// backend/helpers.js
import { generateEmailVerifierInputs } from "@zk-email/zkemail-nr";

// TS versiyonundan aldığınız simpleHash & extractUsernameFromEmail'i buraya yapıştırın:
function simpleHash(data) {
  let sum = 0n;
  for (let i = 0; i < data.length; i++) {
    sum += BigInt(data[i]) * BigInt(i + 1);
  }
  return sum;
}

function extractUsernameFromEmail(emailContent) {
  const usernameMatch = emailContent.match(/Merhaba ([^,]+),/);
  if (usernameMatch) return usernameMatch[1];
  const footerMatch = emailContent.match(/adresine ([^\s]+) i.in g.nderilmi.tir/);
  if (footerMatch) return footerMatch[1];
  throw new Error("Could not extract Instagram username");
}

/** 
 * emlBuffer: Buffer
 * expectedEmail: string
 * expectedUsername: string
 */
export async function generateCircuitInputs(emlBuffer, expectedEmail, expectedUsername) {
  // 1) .eml’den temel inputs’u al
  const base = await generateEmailVerifierInputs(
    emlBuffer,
    { maxHeadersLength: 576, maxBodyLength: 16384, extractFrom: true, extractTo: true }
  );

  // 2) emailHash
  const emailData = new TextEncoder().encode(expectedEmail);
  const emailHash = simpleHash(emailData);

  // 3) username extraction & hash
  const emlString = emlBuffer.toString("utf8");
  const extracted = extractUsernameFromEmail(emlString);
  const claimed = expectedUsername || extracted;

  const extHash = simpleHash(new TextEncoder().encode(extracted));
  const clmHash = simpleHash(new TextEncoder().encode(claimed));

  return {
    ...base,
    expected_to_hash: emailHash.toString(),
    extracted_username_hash: extHash.toString(),
    expected_username_hash: clmHash.toString(),
  };
}
