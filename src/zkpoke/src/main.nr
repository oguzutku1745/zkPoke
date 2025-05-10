mod poke_note;
mod user_info;
mod address_commit;
mod utils; 
use dep::aztec::macros::aztec;

#[aztec]
pub contract ZkPoke {

    use crate::poke_note::PokeNote;
    use crate::user_info::UserInfo;
    use crate::utils::as_field;
    use crate::address_commit::AddressCommit;
    use aztec::{
        macros::{functions::{initializer, private, public, utility, internal}, storage::storage},
        messages::logs::note::encode_and_encrypt_note,
        note::note_interface::{NoteProperties, NoteType},
        prelude::{AztecAddress, Map,  PublicMutable, PublicImmutable, PrivateMutable, PrivateImmutable, PrivateSet, NoteViewerOptions, NoteGetterOptions, RetrievedNote},
        protocol_types::{ traits::{ToField, Serialize, Packable}, hash::poseidon2_hash as poseidon2},
        utils::comparison::Comparator,
    };
    use dep::compressed_string::FieldCompressedString;
    

    #[storage]
    struct Storage<Context> {
        // Regs is not being used currently. Instead, public_regs is used.
        regs     : Map<Field, PrivateImmutable<AddressCommit, Context>, Context>,
        public_regs: Map<Field, PublicImmutable<AztecAddress, Context>, Context>,
        userinfo   : Map<AztecAddress, PrivateImmutable<UserInfo, Context>, Context>,
        intention   : Map<Field, PublicMutable<u8, Context>, Context>,
        pokes       : Map<AztecAddress, PrivateSet<PokeNote, Context>, Context>,
        nullifier_storage   : PublicImmutable<Field,Context>,
    }

    #[public]
    #[initializer]
    fn constructor() {
     
    } 

    #[public]
    pub fn register(
        instagram_id: str<31>,
    ) {
        let ig_fcs         = FieldCompressedString::from_string(instagram_id);
        let instagram_hash = poseidon2([as_field(ig_fcs)]);
        storage.public_regs.at(instagram_hash).initialize(context.msg_sender());
    }

    #[private]
    fn register_info (    
        instagram_id: str<31>,
        full_name: str<31>,
        partial_name: str<31>,
        nationality: str<31>,
    ) {
        let user_info_note = UserInfo::new(
                context.msg_sender(),
                FieldCompressedString::from_string(instagram_id),
                FieldCompressedString::from_string(full_name),
                FieldCompressedString::from_string(partial_name),
                FieldCompressedString::from_string(nationality),
        );

        storage.userinfo.at(context.msg_sender()).initialize(user_info_note).emit(encode_and_encrypt_note(
            &mut context,
            context.msg_sender(),
            context.msg_sender(),
        ));

        //let ig_fcs         = FieldCompressedString::from_string(instagram_id);
        //let instagram_hash = poseidon2([as_field(ig_fcs)]);

        
        //let register_note = AddressCommit::new(context.msg_sender());
        //storage.regs.at(instagram_hash).initialize(register_note);
    }

    #[public]
    pub fn nullify(nullifier:Field) {
        storage.nullifier_storage.initialize(nullifier)
    }

    // TODO: Later, the hash of the note will directly be taken in the private contract; and the commit_hash will be updated accordingly. Time limit issues.
    #[private]
    fn poke (
        instagram_id_receiver:str<31>,
        receiver_addr: AztecAddress,
        randomness: Field,
        // four booleans are packed by the caller to prevent manipulation of note context
        // into a 4-bit mask: bit-0 = ig, bit-1 = full, bit-2 = partial, bit-3 = nat
        mask : u32,      
    ) {
        let ig_rec_field = FieldCompressedString::from_string(instagram_id_receiver);

        let s = storage.userinfo.at(context.msg_sender()).get_note();

        let vals: [FieldCompressedString; 4] = [
            s.instagram_id,
            s.full_name,
            s.partial_name,
            s.nationality,
        ];

        let mut masked: [Field; 4] = [Field::from(0); 4];

        for i in 0..4 {
            let keep      = (mask >> i) & 1;          
            let keep_f: Field = Field::from(keep as u8);  
            masked[i] = keep_f * as_field(vals[i]);     
        }

        let poke_note = PokeNote::new(
            receiver_addr,
            context.msg_sender(),
            ig_rec_field,
            FieldCompressedString::from_field(masked[0]),
            FieldCompressedString::from_field(masked[1]),
            FieldCompressedString::from_field(masked[2]),
            FieldCompressedString::from_field(masked[3]),
            randomness,
        );

        

        storage
            .pokes
            .at(receiver_addr)
            .insert(poke_note)
            .emit(encode_and_encrypt_note(&mut context, receiver_addr, context.msg_sender())
        );
    }


    #[public]
    fn create_commitment(commit_hash:Field) {
        storage.intention.at(commit_hash).write(0)
    }

    // TODO: Later, the update_commitment will directly be called from respond_poke. Time limit issues
    #[private]
    fn respond_poke (commit_hash:Field, intention:u8, sender:AztecAddress) {
        let mut options = NoteGetterOptions::new();
        let notes = storage.pokes.at(context.msg_sender()).get_notes(options.select(PokeNote::properties().sender, Comparator.EQ, sender).set_offset(0));
        let rn = notes.get(0).note;
        let hashed_note = poseidon2(rn.to_fields()); // We should hash the individual field elements. This version is not re-producable on frontend. TODO

        assert(hashed_note == commit_hash);
        assert((intention == 1) | (intention == 2));
    }


    #[public]
    pub fn update_commitment(commit_hash:Field, intention:u8) {
        storage.intention.at(commit_hash).write(intention)
    }

    #[utility]
    unconstrained pub fn get_pokes(owner:AztecAddress, page: u32) -> BoundedVec<PokeNote, 10> {

        let mut opts = NoteViewerOptions::new();

        let offset = page * 16;      
        opts = opts.set_offset(offset);

        storage.pokes
          .at(owner)
          .view_notes(opts)
    }

    #[utility]
    unconstrained pub fn get_intention(commit_hash:Field) -> u8 {
        storage.intention.at(commit_hash).read()
    }

    #[utility]
    unconstrained pub fn get_address(instagram_hash:Field) -> AztecAddress {
        storage.public_regs.at(instagram_hash).read()
    }

    #[utility]
    unconstrained pub fn trial(caller: AztecAddress, sender: AztecAddress) -> BoundedVec<PokeNote, 10> {
        let mut options = NoteViewerOptions::new();
        let notes = storage.pokes.at(caller).view_notes(options.select(PokeNote::properties().sender, Comparator.EQ, sender).set_offset(0));
        notes
    }

}
