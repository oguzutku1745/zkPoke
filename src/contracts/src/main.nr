mod credential_notes;
mod root_struct;
use dep::aztec::macros::aztec;


#[aztec]
pub contract PrivateRegister {

    use crate::credential_notes::CredentialNotes;
    use crate::root_struct::RootStruct;
    use aztec::{
        macros::{functions::{initializer, private, public, utility}, storage::storage},
        messages::logs::note::encode_and_encrypt_note,
        note::note_interface::{NoteProperties, NoteType},
        prelude::{AztecAddress, Map,  PublicMutable, PrivateMutable, PrivateSet, NoteViewerOptions, NoteGetterOptions, RetrievedNote},
        protocol_types::{ traits::{ToField, Serialize}, hash::poseidon2_hash as poseidon2},
        utils::comparison::Comparator,
    };

    global AGE    : Field = 1;
    global STUDENT: Field = 2;
    global WID    : Field = 3;
    global SOCIAL : Field = 4;
    global EVM   : Field = 5;



    #[storage]
    struct Storage<Context> {
        root       : Map<AztecAddress, PublicMutable<RootStruct, Context>, Context>,
        credentials   : Map<AztecAddress, PrivateSet<CredentialNotes, Context>, Context>,
    }

    #[public]
    #[initializer]
    fn constructor() {

    } 

    // A function add_claim
    #[private]
    fn init_credential_note(flag: u8) {
        let credential_note = CredentialNotes::new(context.msg_sender(), flag, 0);
        storage.credentials.at(context.msg_sender()).insert(credential_note).emit(encode_and_encrypt_note(
            &mut context,
            context.msg_sender(),
            context.msg_sender(),
        ));
    }

    #[private]
    fn add_credential_note(flag: u8, claim:Field) {
        let mut options = NoteGetterOptions::new()
        .select(
            CredentialNotes::properties().claim_type,
            Comparator.EQ,
            flag,
        )                      
        .set_limit(1);  

        let old = storage.credentials.at(context.msg_sender()).pop_notes(options);   

        if old.len() > 0 {
            assert(old.get(0).claim_hash == 0);
        }


        let credential_note = CredentialNotes::new(context.msg_sender(), flag, claim);
        storage.credentials.at(context.msg_sender()).insert(credential_note).emit(encode_and_encrypt_note(
            &mut context,
            context.msg_sender(),
            context.msg_sender(),
        ));
    }

    // Update_root
    #[public]
    fn update_verification_root(new_root: Field) {
        let current_root_loc = storage.root.at(context.msg_sender());
  
        current_root_loc.write(
            RootStruct {
                root: new_root,
                owner: context.msg_sender()
            },
        );
    }

    #[private]
    fn verify_note_in_merkle_tree(
        claim_type: u8,
        siblings: [Field; 5],
        indices: [u8; 5],
        expected_root: Field,
    ) {
        let mut options = NoteGetterOptions::new();
        let notes = storage.credentials.at(context.msg_sender()).get_notes(options.select(CredentialNotes::properties().claim_type, Comparator.EQ, claim_type).set_offset(0));

        let rn = notes.get(0).note;

        let leaf = poseidon2(rn.to_fields());

        let mut node = leaf;
        // Iterate through the Merkle proof up to MAX_DEPTH
        for i in 0..5 {
            // Only compute hash if the current level is within the tree depth
            if i < 3 {
                let sibling = siblings[i];

                // Determine the ordering of node and sibling based on the index bit
                // If indices[i] == 0, node is on the left; otherwise, it's on the right
                let (left, right) = if indices[i] == 0 {
                    (node, sibling)
                } else {
                    (sibling, node)
                };

                // Hash the pair to move one level up the tree
                node = poseidon2([left, right]);
            }
        }

        // Return the root computed
        assert(node == expected_root, "Merkle root verification failed");
    }


    #[utility]
    unconstrained fn read_credential(claim_type:u8, addr: AztecAddress) -> CredentialNotes {
        let mut options = NoteViewerOptions::new();
        let notes = storage.credentials.at(addr).view_notes(options.select(CredentialNotes::properties().claim_type, Comparator.EQ, claim_type).set_offset(0));
        notes.get(0)
    }

    #[utility]
    unconstrained fn read_all_credentials(addr:AztecAddress) -> BoundedVec<CredentialNotes, 10> {
        let mut options = NoteViewerOptions::new();
        let notes = storage.credentials.at(addr).view_notes(options.select(CredentialNotes::properties().claim_type, Comparator.LT, 8 as u8));
        notes
    }

    #[utility]
    unconstrained fn read_root(addr: AztecAddress) -> RootStruct {
        storage.root.at(addr).read()
    }

    #[utility]
    unconstrained fn read_credential_hash(claim_type:u8, addr: AztecAddress) -> Field {
        let mut options = NoteViewerOptions::new();
        let notes = storage.credentials.at(addr).view_notes(options.select(CredentialNotes::properties().claim_type, Comparator.EQ, claim_type).set_offset(0));
        poseidon2(notes.get(0).to_fields())
    }

}
