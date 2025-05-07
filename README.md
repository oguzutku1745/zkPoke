# Private Register

A secure credential management system built on the Aztec Network. This application allows users to manage private credentials with zero-knowledge proof verification through Merkle trees.

## Overview

Private Register enables:

- Initialization of credential placeholders
- Addition of credential data
- Creation of Merkle trees for efficient verification
- Verification of credentials using zero-knowledge proofs

## Features

- **Privacy-First Architecture**: Credentials are stored and verified in a privacy-preserving manner
- **Zero-Knowledge Proofs**: Verify credential ownership without revealing the actual credential data
- **Merkle Tree Verification**: Efficient cryptographic proofs of credential inclusion
- **Intuitive Interface**: Step-by-step guided workflow for credential management

## Getting Started

### Prerequisites

- Node.js (v16+)
- Aztec Network Sandbox environment
- Noir compiler

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/private-register.git
   cd private-register
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Make sure your Aztec PXE is running locally:
   ```
   docker-compose up -d
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Usage

The application guides you through a step-by-step process:

1. **Deploy Contract**: Initialize the PrivateRegister contract on the Aztec Network
2. **Initialize Credentials**: Create placeholder credential notes for different claim types
3. **Build Merkle Tree**: Generate a Merkle tree from your credentials for verification
4. **Manage Credentials**: Add real credential data and verify existing credentials

## Technical Implementation

- **Frontend**: React with TypeScript
- **Styling**: TailwindCSS
- **Blockchain**: Aztec Network (Layer 2 privacy-focused rollup)
- **Smart Contract**: Written in Noir (privacy-preserving language for Aztec)

### Key Components

- `src/hooks/usePrivateRegister.tsx`: React hook for contract interaction
- `src/pages/privateRegister.tsx`: UI for credential management
- `lean-imt-await/`: Incremental Merkle Tree implementation
- `src/utils/tree-utils.ts`: Utilities for credential hashing and tree operations

## Development

To compile the Noir contract:

```
cd src/contracts
nargo build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Aztec Network for providing the privacy-focused L2 infrastructure
- Noir language team for the privacy-preserving smart contract language
