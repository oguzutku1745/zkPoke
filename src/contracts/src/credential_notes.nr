use dep::aztec::{
    macros::notes::note, oracle::random::random, protocol_types::{address::AztecAddress, traits::{Packable,ToField}},
};

#[note]
#[derive(Eq)]
pub struct CredentialNotes {
    owner: AztecAddress,
    claim_type: u8,
    claim_hash: Field,
    randomness: Field,
}

impl CredentialNotes {
    pub fn new(owner: AztecAddress, claim_type: u8, claim_hash: Field) -> Self {
        // Safety: We use the randomness to preserve the privacy of the note recipient by preventing brute-forcing,
        // so a malicious sender could use non-random values to make the note less private. But they already know
        // the full note pre-image anyway, and so the recipient already trusts them to not disclose this
        // information. We can therefore assume that the sender will cooperate in the random value generation.
        let randomness = unsafe { random() };
        Self { owner, claim_type, claim_hash, randomness }
    }

    pub fn to_fields(self) -> [Field; 4] {
        [
            self.owner.to_field(),
            self.claim_type.to_field(),
            self.claim_hash,
            self.randomness,
        ]
    }
}