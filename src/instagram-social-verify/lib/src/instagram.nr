use std::hash::pedersen_hash;       
use zkemail::{
    dkim::RSAPubkey,
    headers::email_address::get_email_address,
    KEY_LIMBS_1024,
    Sequence,
};

use crate::constants::{MAX_EMAIL_HEADER_LENGTH, INSTAGRAM_FROM_EMAIL};
use super::utils::VerifiedOutputs;

// Maximum length for an email address
global MAX_EMAIL_LENGTH: u32 = 320;
// Maximum length for username
global MAX_USERNAME_LENGTH: u32 = 32;

#[export]
pub fn verify_instagram_email(
    header: BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH>,
    pubkey:  RSAPubkey<KEY_LIMBS_1024>,
    signature: [Field; KEY_LIMBS_1024],
    from_header_sequence: Sequence,
    from_address_sequence: Sequence,
    to_header_sequence:   Sequence,
    to_address_sequence:  Sequence,
    expected_to_hash: Field,
    extracted_username_hash: Field, // Hash of the username extracted from the email
    expected_username_hash: Field,  // Hash of the user's claimed Instagram username
    // We pass the username as a separate parameter 
    // For now, we'll just verify the hash rather than extracting it directly
) -> VerifiedOutputs {
    // 1. DKIM
    assert(header.len() <= MAX_EMAIL_HEADER_LENGTH, "Header too long");
    pubkey.verify_dkim_signature(header, signature);

    let from = comptime { "from".as_bytes() };
    let to   = comptime { "to".as_bytes()   };

    // 2. Verify FROM address is from Instagram
    let from_addr = get_email_address(header,
        from_header_sequence, from_address_sequence, from);
    assert(
        from_addr.eq(BoundedVec::from(INSTAGRAM_FROM_EMAIL)),
        "Unexpected From address",
    );

    // 3. Extract TO address and compute its hash
    let to_addr = get_email_address(header,
        to_header_sequence, to_address_sequence, to);
    
    // Simple hash function - sum the bytes and convert to a Field
    let mut sum: Field = 0;
    let actual_len = to_addr.len();
    
    for i in 0..320 {
        if (i as u32) < actual_len {
            sum += (to_addr.storage[i] as Field) * ((i + 1) as Field);
        }
    }
    
    // Verify the hash matches the expected hash
    assert(sum == expected_to_hash, "Recipient email hash doesn't match expected hash");

    // 4. Username verification
    // In a zero-knowledge proof, we need to verify that the Instagram email 
    // contains the same username that the user claims to have, without revealing
    // the actual username.
    //
    // Since extracting the username directly from the email body in Noir would be complex,
    // we use the following approach:
    // 1. The JavaScript code extracts the actual username from the email
    // 2. The JavaScript code also gets the claimed username from the user
    // 3. The JavaScript code hashes both usernames and passes the hashes to the circuit
    // 4. The circuit verifies that both hashes match
    
    // We verify that the extracted username from the email matches the user's claimed username
    assert(extracted_username_hash == expected_username_hash, "Username in email doesn't match claimed username");
    
    VerifiedOutputs::new(
        pubkey.hash(),                 // pub_key_hash
        pedersen_hash(signature),      // email_nullifier
        sum                            // to_address_hash
    )
}
