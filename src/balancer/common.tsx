import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { nearAPI, NearProvider } from 'near-web3-provider';
import { setEthProvider, setNearConnection } from '@near-eth/client';
import Web3Modal from 'web3modal';
import { walletconnect } from 'web3modal/dist/providers/connectors';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const MAX_UINT_256 = new BigNumber(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
);
export const TOKEN_PRECISION = 18;

// NEAR TOKENS
export const GKC1_ADDRESS = '0xE599045A0a93fF901B995c755f1599DB6ACD44e6';
export const GKC2_ADDRESS = '0xc1dd4f43e799A08Ec72b455c723C7FE0e9e85A70';

export const TST_ADDRESS_ON_ETH = '0x722dd3F80BAC40c951b51BdD28Dd19d435762180';

// NEAR CONTRACT ADDRESSES
export const EXCHANGE_PROXY_ADDRESS =
  '0xdB9217dF5c41887593e463CFA20036B62a4E331C';
export const DS_PROXY_REGISTRY_ADDRESS =
  '0x053A91D4210bb775507014308cdE6fdCa19Dfc2B';
export const B_ACTIONS_ADDRESS = '0x43DBAc87A7d98eB2aeF37648F3DD852634641a8f';
export const B_FACTORY_ADDRESS = '0xE1709acDFaF12dCaa0960dDB56902d71f09B657B';

// ABIs
export const ERC20Abi = require('../abi/ERC20.json');
export const ExchangeProxyAbi = require('../abi/ExchangeProxy.json');
export const DSProxyAbi = require('../abi/DSProxy.json');
export const DSProxyRegistryAbi = require('../abi/DSProxyRegistry.json');
export const BActionsAbi = require('../abi/BActions.json');
export const BPoolAbi = require('../abi/BPool.json');
export const WETHAbi = require('../abi/Weth.json');

const nearConfig = {
  nodeUrl: 'https://rpc.testnet.near.org/',
  keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
  networkId: 'testnet',
  evmAccountId: 'evm',
  walletUrl: 'https://wallet.testnet.near.org',
  helperUrl: 'https://helper.testnet.near.org',
  explorerUrl: 'https://explorer.testnet.near.org',
};

const web3Modal = new Web3Modal({ cacheProvider: true });

// COMMON VARIABLES/FUNCTIONS
export let walletAccount = null;
export let web3 = null;
export let ethProvider = null;

export const initNear = async () => {
  const near = await nearAPI.connect(nearConfig);

  // TODO: WalletConnection needed? Or perhaps WalletAccount below isn't needed?
  // const nearConnection = new nearAPI.WalletConnection(near);
  // console.log({ nearConnection });
  // setNearConnection(nearConnection);

  walletAccount = new nearAPI.WalletAccount(near, undefined);

  let accountId = walletAccount.getAccountId();
  if (!accountId) {
    await walletAccount.requestSignIn(
      'evm',
      'Balancer Exchange',
      undefined,
      undefined,
    );
    accountId = walletAccount.getAccountId();
  }

  setNearConnection(walletAccount);

  web3 = new Web3(
    new NearProvider({
      nodeUrl: nearConfig.nodeUrl,
      keyStore: nearConfig.keyStore,
      masterAccountId: accountId,
      networkId: nearConfig.networkId,
      evmAccountId: nearConfig.evmAccountId,
      walletUrl: nearConfig.walletUrl,
      explorerUrl: nearConfig.explorerUrl,
      isReadOnly: false,
    }),
  );
};

export const initEth = async () => {
  ethProvider = await web3Modal.connect();
  console.log({ ethProvider });
  setEthProvider(ethProvider);
};

export const getEthAccount = async () => {
  const [sender] = await ethProvider.request({ method: 'eth_requestAccounts' });
  console.log({ sender });
  return sender;
};

export const getNEARAccountId = () => {
  return walletAccount.getAccountId();
};

export const getAccount = async (): Promise<string> => {
  return (await web3.eth.getAccounts())[0];
};

export const scale = (input: BigNumber, decimalPlaces: number): BigNumber => {
  const scalePow = new BigNumber(decimalPlaces.toString());
  const scaleMul = new BigNumber(10).pow(scalePow);
  return input.times(scaleMul);
};

export function toWei(val: string | BigNumber): BigNumber {
  return scale(new BigNumber(val.toString()), 18).integerValue();
}
