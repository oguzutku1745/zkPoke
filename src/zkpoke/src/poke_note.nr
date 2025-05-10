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
        randomness: Field,
    ) -> Self {

        Self { owner, sender, instagram_id_receiver, instagram_id_sender, full_name, partial_name, nationality,  randomness }
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