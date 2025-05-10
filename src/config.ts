import { createPXEClient, PXE } from '@aztec/aztec.js';
import { getDeployedTestAccountsWallets } from '@aztec/accounts/testing/lazy';

export class PrivateEnv {
  private constructor(private pxe: PXE) {}

  static async create(pxeURL: string) {
    const pxe = createPXEClient(pxeURL);
    return new PrivateEnv(pxe);
  }

  async getWallet(index: number = 0) {
    const wallets = await getDeployedTestAccountsWallets(this.pxe);
    const wallet = wallets[index];
    console.log('wallet', wallet.getAddress());
    if (!wallet) {
      console.error(
        'Wallet not found. Please connect the app to a testing environment with deployed and funded test accounts.',
      );
    }
    return wallet;
  }
}

export const deployerEnv = await PrivateEnv.create(process.env.PXE_URL || 'http://localhost:8080');

// Predefined user wallet information
export const userWallets = {
  alice: {
    name: 'Alice',
    instagram: 'alice.eth',
    index: 0,  // First wallet from getDeployedTestAccountsWallets
  },
  akin: {
    name: 'Akın',
    instagram: '@akinspur',
    index: 1,  // Second wallet from getDeployedTestAccountsWallets
  }
};

// Store selected user in localStorage for persistence
export const getSelectedUser = () => {
  return localStorage.getItem('selectedUser') || 'alice';
};

export const setSelectedUser = (user: string) => {
  localStorage.setItem('selectedUser', user);
};
