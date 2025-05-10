use dep::aztec::{
    macros::notes::note, oracle::random::random, protocol_types::{address::AztecAddress, traits::{Packable,ToField}},
};
use dep::compressed_string::FieldCompressedString;
use crate::utils::as_field;

#[note]
#[derive(Eq)]
pub struct PokeNote {
    owner: AztecAddress,
    sender: AztecAddress,
    instagram_id_receiver: FieldCompressedString,
    instagram_id_sender: FieldCompressedString,
    full_name: FieldCompressedString,
    partial_name: FieldCompressedString,
    nationality: FieldCompressedString,
    randomness: Field,
}

impl PokeNote {

    pub fn new(
        owner: AztecAddress,
        sender: AztecAddress,
        instagram_id_receiver: FieldCompressedString,
        instagram_id_sender: FieldCompressedString,
        full_name: FieldCompressedString,
        partial_name: FieldCompressedString,
        nationality: FieldCompressedString,
    ) -> Self {
        // Safety: We use the randomness to preserve the privacy of the note recipient by preventing brute-forcing,
        // so a malicious sender could use non-random values to make the note less private. But they already know
        // the full note pre-image anyway, and so the recipient already trusts them to not disclose this
        // information. We can therefore assume that the sender will cooperate in the random value generation.
        let randomness = unsafe { random() };
        Self { owner, sender, instagram_id_receiver, full_name, partial_name, nationality, instagram_id_sender, randomness }
    }

    pub fn to_fields(self) -> [Field; 8] {
        [
            self.owner.to_field(),
            self.sender.to_field(),
            as_field(self.instagram_id_receiver),
            as_field(self.instagram_id_sender),
            as_field(self.full_name),
            as_field(self.partial_name),
            as_field(self.nationality),
            self.randomness,
        ]
    }
}