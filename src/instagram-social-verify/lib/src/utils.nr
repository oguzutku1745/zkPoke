pub struct VerifiedOutputs {
    pub_key_hash: Field,
    email_nullifier: Field,
    to_address_hash: Field,
}

impl VerifiedOutputs {
    pub fn new(pk: Field, nul: Field, to_hash: Field) -> Self {
        Self { pub_key_hash: pk, email_nullifier: nul, to_address_hash: to_hash }
    }
}