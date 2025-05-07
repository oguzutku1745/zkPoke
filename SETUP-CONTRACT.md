# Setting Up the PrivateRegister Contract

This document explains how to copy and set up the PrivateRegister contract in your React Box project.

## File Structure

The PrivateRegister contract consists of these main Noir files:
- `main.nr`: Main contract implementation
- `credential_notes.nr`: Definition of credential notes
- `root_struct.nr`: Structure for storing the Merkle root

You'll need to copy these files into your project and compile them to generate the necessary artifacts.

## Steps to Set Up

1. **Copy Contract Files**

   Create a directory for the PrivateRegister contract:
   ```bash
   mkdir -p src/contracts/src
   ```

   Copy the contract files from the private_register project:
   ```bash
   cp /path/to/private_register/src/main.nr src/contracts/src/
   cp /path/to/private_register/src/credential_notes.nr src/contracts/src/
   cp /path/to/private_register/src/root_struct.nr src/contracts/src/
   ```

2. **Update Nargo.toml**

   Create or update the `src/contracts/Nargo.toml` file:
   ```toml
   [package]
   name = "private_register"
   type = "contract"
   authors = ["Your Name"]
   compiler_version = "0.18.0"

   [dependencies]
   aztec = { git="https://github.com/AztecProtocol/aztec-packages/", tag="master", directory="noir-projects/aztec-nr" }
   ```

3. **Compile the Contract**

   Navigate to the contracts directory and compile:
   ```bash
   cd src/contracts
   nargo compile
   ```

4. **Copy Artifacts**

   Create or ensure you have an artifacts directory:
   ```bash
   mkdir -p artifacts
   ```

   Copy the compiled contract artifacts:
   ```bash
   cp -r src/contracts/target/* artifacts/
   ```

## Importing the Contract

In your JavaScript/TypeScript code, you can import the compiled contract like this:

```typescript
const { PrivateRegisterContract } = await import('../../artifacts/PrivateRegister');
```

## Lean IMT Implementation

The project also requires the Lean Incremental Merkle Tree implementation:

1. **Create Directory for IMT**
   ```bash
   mkdir -p lean-imt-await
   ```

2. **Copy or Implement the IMT Files**

   Copy the implementation files from the original project:
   ```bash
   cp /path/to/private_register/dist/lean-imt-await/lean-imt-await.js lean-imt-await/
   ```

## Testing

After setting up the contract and IMT implementation:

1. Make sure Aztec PXE is running
2. Start the application with `npm run dev`
3. Navigate to the app in your browser
4. Follow the step-by-step process to deploy and interact with your PrivateRegister contract 