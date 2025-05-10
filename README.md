# zkPoke

A privacy-preserving social "poking" application built on Aztec Network. zkPoke allows users to securely reach out to others while selectively revealing personal information through zero-knowledge proofs.

## Application Overview

zkPoke consists of three main components:

### 1. Magna (Verification Layer)

Magna serves as a bridge between Web2's feudal data ownership model and Web3's user sovereignty:

- Manages user credentials through secure zero-knowledge proofs
- Verifies user identity while preserving privacy
- Built on Aztec Network's privacy infrastructure
- May be made available as a public utility in the future

The name "Magna" draws inspiration from the Magna Carta - the historic document that first transferred power from monarchs to citizens. Similarly, Magna helps users reclaim ownership of their data and identity from centralized Web2 platforms.


### 2. zkPoke Smart Contract

This is the on-chain component that handles the secure storage and management of user data and interactions:

- **User Registration**: Users can register with their Instagram ID, associating their wallet address with their social identity
- **Profile Information**: Users can privately store their full name, partial name, and nationality on-chain
- **Private Poking**: Users can send pokes to others with selective disclosure of personal details
- **Commitment System**: Enables privacy-preserving response to pokes through a commitment scheme
- **Note-Based Storage**: Uses Aztec's private note system to securely store user information and pokes
- **Intention Tracking**: Records user intentions (interested/not interested) without revealing the content of messages

## Technical Overview

### Aztec's Private Notes and Merkle Trees

zkPoke leverages Aztec's private Note system combined with Merkle trees to create a powerful privacy framework:

- **Notes** are encrypted data structures that serve as the building blocks for private state in Aztec
- Each user stores 8 private Notes on-chain (one for each credential type)
- These Notes are fully encrypted and only visible to their owner
- We organize these Notes into a binary Merkle tree for efficient verification
- A Merkle tree is a binary tree where each leaf node represents a credential (stored as a Note)
- Each non-leaf node is a hash of its two child nodes
- The Merkle root (top hash) represents the entire tree and enables efficient verification

This combination provides efficient verification, privacy preservation, compact representation, and selective disclosure of credentials.

### Custom Merkle Tree Implementation

We developed a specialized implementation to ensure seamless compatibility:

- Our custom Merkle tree implementation works in the frontend for creating and managing credential trees
- The corresponding verification logic is implemented directly in the Aztec contract
- Existing libraries like zk-kit use Poseidon hash which works with Noir but isn't compatible with Aztec Network
- Our implementation uses Aztec's hash functions, ensuring end-to-end compatibility
- This creates a complete system where trees generated in the frontend can be verified directly on-chain

### Credential Storage and Verification

Privacy is maintained throughout the credential handling process:

- Credentials are encrypted and stored as 8 Notes in the user's private state
- A Merkle tree is constructed from these credentials
- The Merkle root is computed and stored for efficient verification
- When a user wants to prove credential ownership, they generate a zero-knowledge proof
- This proof verifies that a specific credential exists in their tree without revealing any details
- The verification checks that the credential's hash is included in the tree with the known root

### zkPoke Contract Key Features

The zkPoke contract provides several privacy-preserving functionalities:

- **Private Data Storage**: User information (names, nationality) is stored as encrypted notes. These notes are derived from zkPassport's disclosure statement.
- **Selective Disclosure**: Users can choose which personal details to share when poking others using a bit mask. To preven manipulation, those disclosure's are being made from 
- **Commitment-Based Responses**: Recipients can respond to pokes without revealing the content of messages
- **Intention Tracking**: Records if a user is interested or not interested in a poke
- **Note Retrieval**: Allows users to view received pokes with pagination
- **Hash-Based Identification**: Uses hashed Instagram IDs to find users on the platform

### Advantages of Our Approach

Using Merkle trees with Aztec provides several key benefits:

- **Efficient Verification**: Merkle trees enable validating the existence of a credential without revealing other credentials
- **Privacy Preservation**: Only a single hash (the root) needs to be shared to verify multiple credentials
- **Compact Representation**: The entire credential set is compressed into one root hash
- **Selective Disclosure**: Users can choose which credentials to prove without exposing others
- **Enhanced Privacy**: Users control exactly what information they share
- **Gas Efficiency**: Storing only the root hash publicly significantly reduces on-chain costs
- **Scalability**: Users can have many credentials without increasing public on-chain footprint
- **Proof Verification**: Claims can be cryptographically verified without revealing sensitive data
- **Cross-Chain Potential**: The Merkle root structure enables verification across multiple blockchains
- **Logarithmic Verification**: Verification requires only the path from a leaf to the root (logarithmic in size)

### User Registration Flow

zkPoke's registration process preserves privacy while establishing identity:

1. User connects their wallet to the application
2. User registers with their Instagram ID, creating a public mapping of their ID hash to wallet address
3. User provides additional information (full name, partial name, nationality) which is stored privately
4. Credentials are converted to Notes and added to a new Merkle tree
5. The 8 credential Notes are stored privately on-chain
6. The Merkle root is computed and stored for verification
7. A private registration is completed with the user's identity secured
8. Only the user can access and prove ownership of their credentials

### Poking Flow

The private messaging system works as follows:

1. Sender selects a recipient by their Instagram ID
2. Sender chooses which personal details to share (using a bit mask)
3. A private PokeNote is created containing the selected information
4. The note is encrypted and stored in the recipient's private storage
5. The recipient can view all received pokes when they access the platform
6. The recipient can respond with intention (interested/not interested)
7. The response is recorded through a commitment system for privacy

## Getting Started

To run the zkPoke application locally:

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Connect to the Aztec testnet in your browser

## Learn More

For more information about the technologies used:

- [Aztec Network](https://aztec.network/)
- [Zero-Knowledge Proofs](https://ethereum.org/en/zero-knowledge-proofs/)
- [Merkle Trees](https://ethereum.org/en/developers/tutorials/merkle-proofs-for-offline-data-integrity/)
