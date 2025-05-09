# zkPoke

A privacy-preserving social "poking" application built on Aztec Network. zkPoke allows users to securely reach out to others while selectively revealing personal information through zero-knowledge proofs.

## Application Overview

zkPoke consists of two main components:

### 1. Verification Layer

This is the foundation of the application that handles credential verification:

- Manages user credentials through secure zero-knowledge proofs
- Verifies user identity while preserving privacy
- Built on Aztec Network's privacy infrastructure
- May be made available as a public utility in the future

### 2. zkPoke Messaging

This is the social layer that enables private communication:

- Users can "poke" others with a private message
- Senders can selectively disclose personal information (age, university, etc.)
- Senders don't know if the recipient is on the platform
- Messages are stored as encrypted Notes with only a commitment hash on-chain
- Recipients can view pokes when they access the platform
- Recipients can respond by proving ownership and indicating interest (interested or not interested)

## Technical Overview

### Aztec's Private Notes

zkPoke leverages Aztec's private Note system as the foundation for privacy:

- **Notes** are encrypted data structures that serve as the building blocks for private state in Aztec
- Each Note contains credential information that is fully encrypted on-chain
- Only the owner can decrypt and view their own Notes, ensuring complete privacy
- This allows us to store credential information without exposing it publicly

### Binary Merkle Trees

We use binary Merkle trees to efficiently handle credential verification:

- A Merkle tree is a binary tree where each leaf node represents a credential (stored as a Note)
- Each non-leaf node is a hash of its two child nodes
- Only the Merkle root (a single hash value) needs to be stored on-chain
- This structure allows proving credential ownership without revealing the credential details

### Custom Merkle Tree Implementation

We had to develop our own Merkle tree implementation for compatibility reasons:

- Existing libraries like zk-kit use Poseidon hash which works with Noir but isn't compatible with Aztec Network
- Our custom implementation uses Aztec's hash functions, ensuring compatibility with the Aztec ecosystem
- This allows seamless integration with Aztec's privacy infrastructure
- The result is a cryptographically secure Merkle tree that works natively with Aztec contracts

### Credential Storage and Verification

Privacy is maintained throughout the credential handling process:

- Credentials are encrypted and stored as Notes in the user's Merkle tree
- The contract only stores the Merkle root, not the individual credentials
- When a user wants to prove credential ownership, they generate a zero-knowledge proof
- This proof verifies that a specific credential exists in their tree without revealing any details
- The verification checks that the credential's hash is included in the tree with the known root

### Advantages of Our Approach

Using Merkle trees with Aztec provides several key benefits:

- **Enhanced Privacy**: Users control exactly what information they share
- **Gas Efficiency**: Storing only the root hash significantly reduces on-chain storage costs
- **Scalability**: Users can have many credentials without increasing on-chain costs
- **Selective Disclosure**: Users can choose which credentials to expose in each interaction
- **Proof Verification**: Claims can be cryptographically verified without revealing sensitive data

### User Registration Flow

zkPoke's registration process preserves privacy while establishing identity:

1. User connects their wallet to the application
2. User selects which credentials they want to add (e.g., age verification, university)
3. Credentials are converted to Notes and added to a new Merkle tree
4. The Merkle root is computed and stored in the contract
5. A private registration is completed with the user's identity secured
6. Only the user can access and prove ownership of their credentials

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
