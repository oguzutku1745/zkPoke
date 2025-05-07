import { AccountWallet, CompleteAddress, Contract, Fr, createLogger } from '@aztec/aztec.js';
import { PrivateRegisterContract } from '../artifacts/PrivateRegister.js';
import { deployerEnv } from '../src/config.js';

const logger = createLogger('aztec:http-pxe-client');

describe('PrivateRegister Contract Tests', () => {
  let wallet: AccountWallet;
  let contract: Contract;
  const numberToSet = Fr.random();
  let accountCompleteAddress: CompleteAddress;

  beforeAll(async () => {
    wallet = await deployerEnv.getWallet();
    accountCompleteAddress = wallet.getCompleteAddress();
    const salt = Fr.random();

    contract = await PrivateRegisterContract.deploy(wallet)
      .send({ contractAddressSalt: salt })
      .deployed();

    logger.info(`L2 contract deployed at ${contract.address}`);
  }, 60000);

});
