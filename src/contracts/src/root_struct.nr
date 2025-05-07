use dep::aztec::protocol_types::{
    address::AztecAddress,
    traits::{Deserialize, Packable, Serialize}
};

#[derive(Deserialize, Packable, Serialize)]
pub struct RootStruct {
    root: Field,
    owner: AztecAddress,
}