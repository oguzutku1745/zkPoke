# PrivateRegister Contract Integration

This document explains how the Aztec PrivateRegister contract has been integrated into the react-box template.

## Overview

The PrivateRegister contract is a credential management system that uses Merkle trees for credential verification. It provides the following functionality:

1. Initialize credential notes
2. Add new credentials
3. Build a Merkle tree for verification
4. Verify credentials using Merkle proofs

## Project Structure

The integration adds the following files to the react-box template:

- `lean-imt-await/lean-imt-await.js` - Implementation of an incremental Merkle tree
- `lean-imt-await/lean-imt-await.d.ts` - TypeScript declarations for the IMT
- `src/utils/tree-utils.ts` - Utility functions for credential hashing and bit manipulation
- `src/hooks/usePrivateRegister.tsx` - React hook for interacting with the contract
- `src/pages/privateRegister.tsx` - UI for the PrivateRegister contract

## How to Use

### 1. Deploy the Contract

First, you need to deploy the PrivateRegister contract. Click the "Deploy Contract" button on the PrivateRegister page.

### 2. Initialize Credential Notes

After deploying the contract, initialize credential notes (0-7) by clicking the "Initialize Credential Notes" button. This creates empty credential notes in the contract.

### 3. View Credentials

Click the "Get All Credentials" button to view the current credentials stored in the contract.

### 4. Initialize the Merkle Tree

Click the "Initialize Tree" button to build a Merkle tree from the current credentials and update the verification root in the contract.

### 5. Add a Credential

To add a new credential:
- Enter the claim type (0-7)
- Enter a claim hash value
- Click "Add Credential"

### 6. Verify a Credential

To verify a credential:
- Enter the claim type of the credential to verify
- Click "Verify Credential"

## Technical Implementation

The integration uses the following Aztec features:

1. **PrivateRegister Contract**: A Noir contract implementing credential management with private notes.
2. **BatchCall**: Used to batch multiple init_credential_note calls for efficiency.
3. **Lean IMT**: An incremental Merkle tree implementation for credential verification.
4. **Merkle Proof**: Generating and verifying proofs that a credential is part of the tree.

## Original Contract Source

The original contract is implemented in Noir and has these main components:
- `main.nr` - Main contract implementation
- `credential_notes.nr` - Definition of credential notes
- `root_struct.nr` - Structure for storing the Merkle root

## Notes

- Make sure you have compiled the original Noir contract and have the generated artifacts in the `artifacts` folder.
- The contract implements a ring buffer for credentials with a maximum of 10 entries.
- Merkle tree verification uses a padded depth of 5 for compatibility. 