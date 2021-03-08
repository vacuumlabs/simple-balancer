import { SOR } from '@balancer-labs/sor';
import { InfuraProvider, Web3Provider } from '@ethersproject/providers';
import BigNumber from 'bignumber.js';
import {
  TOKEN_PRECISION,
  EXCHANGE_PROXY_ADDRESS,
  ERC20Abi,
  ExchangeProxyAbi,
  getAccount,
  web3,
  scale,
  MAX_UINT_256,
  GKC1_ADDRESS,
  GKC2_ADDRESS,
  initNear,
  provider,
} from './common';
import { getProxy } from './simple-balancer-pools';

const loginWithNear = async () => {
  await initNear();
};

const getAssetBalance = async (assetAddress: string): Promise<BigNumber> => {
  console.log(`Get asset ${assetAddress} balance`);

  const assetContract = new web3.eth.Contract(ERC20Abi, assetAddress);
  const result = await assetContract.methods
    .balanceOf(await getAccount())
    .call();
  return scale(new BigNumber(result), -TOKEN_PRECISION);
};

const getAssetAllowance = async (assetAddress: string): Promise<BigNumber> => {
  console.log(`Get asset ${assetAddress} allowance`);

  const assetContract = new web3.eth.Contract(ERC20Abi, assetAddress);
  const result = await assetContract.methods
    .allowance(await getAccount(), EXCHANGE_PROXY_ADDRESS)
    .call();
  return scale(new BigNumber(result), -TOKEN_PRECISION);
};

const getGKC1Balance = async (): Promise<BigNumber> => {
  console.log('Get GKC1 balance');
  return getAssetBalance(GKC1_ADDRESS);
};

const getGKC1Allowance = async (): Promise<BigNumber> => {
  console.log('Get GKC1 allowance');
  return getAssetAllowance(GKC1_ADDRESS);
};

const getGKC2Balance = async (): Promise<BigNumber> => {
  console.log('Get GKC2 balance');
  return getAssetBalance(GKC2_ADDRESS);
};

const getGKC2Allowance = async (): Promise<BigNumber> => {
  console.log('Get GKC2 allowance');
  return getAssetAllowance(GKC2_ADDRESS);
};

const unlockAsset = async (assetAddress: string, unlockFor: string) => {
  console.log(`Unlock asset ${assetAddress}`);
  try {
    const assetContract = new web3.eth.Contract(ERC20Abi, assetAddress);
    await assetContract.methods
      .approve(unlockFor, MAX_UINT_256)
      .send({ from: await getAccount() });
  } catch (e) {
    console.log(`Unlock asset ${assetAddress} error:`, e);
    throw e;
  }
};

const unlockGKC1 = async () => {
  await unlockAsset(GKC1_ADDRESS, EXCHANGE_PROXY_ADDRESS);
  await unlockAsset(GKC1_ADDRESS, await getProxy());
};

const unlockGKC2 = async () => {
  await unlockAsset(GKC2_ADDRESS, EXCHANGE_PROXY_ADDRESS);
  await unlockAsset(GKC2_ADDRESS, await getProxy());
};

const swapGKC1forGKC2 = async (amount: number) => {
  console.log(`Swap ${amount}GKC1 for GKC2`);
  const GAS_PRICE = new BigNumber('100000000000');
  const MAX_POOLS = 4;
  const CHAIN_ID = 1313161556;

  const infuraProvider = new InfuraProvider(
    'kovan',
    'b77a7dc85e294e329426fef76b6cf8b6',
  );

  const sor = new SOR(
    new Web3Provider(provider),
    GAS_PRICE,
    MAX_POOLS,
    CHAIN_ID,
    `https://ipfs.fleek.co/ipns/balancer-bucket.storage.fleek.co/balancer-exchange-kovan/pools?timestamp=${Date.now()}`,
  );

  console.log('Fetch SOR pools');
  await sor.fetchPools();

  console.log('Get swaps from SOR');
  const [tradeSwaps, tradeAmount, spotPrice] = await sor.getSwaps(
    GKC1_ADDRESS,
    GKC2_ADDRESS,
    'swapExactIn',
    scale(new BigNumber(amount), TOKEN_PRECISION),
  );
  console.log('SOR swaps:', { tradeSwaps, tradeAmount, spotPrice });

  const exchangeProxyContract = new web3.eth.Contract(
    ExchangeProxyAbi,
    EXCHANGE_PROXY_ADDRESS,
  );

  try {
    const maxSlippage = 0.005;

    console.log('Call exchange proxy contract');
    const result = await exchangeProxyContract.methods
      .multihopBatchSwapExactIn(
        tradeSwaps,
        GKC1_ADDRESS,
        GKC2_ADDRESS,
        scale(new BigNumber(amount), TOKEN_PRECISION),
        tradeAmount.div(1 + maxSlippage).integerValue(BigNumber.ROUND_DOWN),
      )
      .send({ from: await getAccount() });
    console.log('Swap result:', { result });
  } catch (e) {
    console.log('Swap GKC1 for GKC2 error:', e);
    throw e;
  }
};

export {
  swapGKC1forGKC2,
  unlockGKC1,
  unlockGKC2,
  getGKC1Balance,
  getGKC1Allowance,
  getGKC2Balance,
  getGKC2Allowance,
  loginWithNear,
};
