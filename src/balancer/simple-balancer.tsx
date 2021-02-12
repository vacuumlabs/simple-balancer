import { SOR } from '@balancer-labs/sor';
import { InfuraProvider } from '@ethersproject/providers';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import {
  TOKEN_PRECISION,
  WETH_ADDRESS,
  DAI_ADDRESS,
  EXCHANGE_PROXY_ADDRESS,
  ERC20Abi,
  ExchangeProxyAbi,
  getAccount,
  web3,
  scale,
  WETHAbi,
  MAX_UINT_256,
} from './common';

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

const getETHBalance = async (): Promise<BigNumber> => {
  console.log(`Get ETH balance`);
  console.log({ s: scale(new BigNumber('62607572233557'), -18).toString() });

  const result = await web3.eth.getBalance(await getAccount());
  return scale(new BigNumber(result), -TOKEN_PRECISION);
};

const getWETHBalance = async (): Promise<BigNumber> => {
  console.log('Get WETH balance');
  return getAssetBalance(WETH_ADDRESS);
};

const getWETHAllowance = async (): Promise<BigNumber> => {
  console.log('Get WETH allowance');
  return getAssetAllowance(WETH_ADDRESS);
};

const getDAIBalance = async (): Promise<BigNumber> => {
  console.log('Get DAI balance');
  return getAssetBalance(DAI_ADDRESS);
};

const getDAIAllowance = async (): Promise<BigNumber> => {
  console.log('Get DAI allowance');
  return getAssetAllowance(DAI_ADDRESS);
};

const unlockAsset = async (assetAddress: string) => {
  console.log('Unlock WETH');
  try {
    const assetContract = new web3.eth.Contract(ERC20Abi, assetAddress);
    await assetContract.methods
      .approve(EXCHANGE_PROXY_ADDRESS, MAX_UINT_256)
      .send({ from: await getAccount() });
  } catch (e) {
    console.log('Unlock WETH error:', e);
    throw e;
  }
};

const unlockWETH = async () => {
  await unlockAsset(WETH_ADDRESS);
};

const unlockDAI = async () => {
  await unlockAsset(DAI_ADDRESS);
};

const unlockMetamask = async () => {
  console.log('Unlock Metamask');
  try {
    await Web3.givenProvider.enable();
    const accounts = await web3.eth.getAccounts();
    console.log('Accounts received from Metamask:', { accounts });
  } catch (e) {
    console.log('Unlock metamask error:', e);
  }
};

const swapETHforWETH = async (amount: number) => {
  console.log(`Swap ${amount}ETH for WETH`);

  try {
    const WETHContract = new web3.eth.Contract(WETHAbi, WETH_ADDRESS);
    const result = await WETHContract.methods.deposit().send({
      from: await getAccount(),
      value: `0x${scale(new BigNumber(amount), TOKEN_PRECISION).toString(16)}`,
    });
    console.log('Swap ETH for WETH result:', { result });
  } catch (e) {
    console.log('Swap ETH for WETH error:', e);
    throw e;
  }
};

const swapWETHforDai = async (amount: number) => {
  console.log(`Swap ${amount}WETH for DAI`);
  const GAS_PRICE = new BigNumber('100000000000');
  const MAX_POOLS = 4;
  const CHAIN_ID = 42;

  const infuraProvider = new InfuraProvider(
    'kovan',
    '237c3102f39b4940abbe12dc49165cd6',
  );

  const sor = new SOR(
    infuraProvider,
    GAS_PRICE,
    MAX_POOLS,
    CHAIN_ID,
    `https://ipfs.fleek.co/ipns/balancer-bucket.storage.fleek.co/balancer-exchange-kovan/pools?timestamp=${Date.now()}`,
  );

  console.log('Fetch SOR pools');
  await sor.fetchPools();

  console.log('Get swaps from SOR');
  const [tradeSwaps, tradeAmount, spotPrice] = await sor.getSwaps(
    WETH_ADDRESS,
    DAI_ADDRESS,
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
        WETH_ADDRESS,
        DAI_ADDRESS,
        scale(new BigNumber(amount), TOKEN_PRECISION),
        tradeAmount.div(1 + maxSlippage).integerValue(BigNumber.ROUND_DOWN),
      )
      .send({ from: await getAccount() });
    console.log('Swap result:', { result });
  } catch (e) {
    console.log('Swap WETH for DAI error:', e);
    throw e;
  }
};

export {
  getETHBalance,
  getWETHBalance,
  getWETHAllowance,
  getDAIBalance,
  getDAIAllowance,
  swapETHforWETH,
  swapWETHforDai,
  unlockMetamask,
  unlockWETH,
  unlockDAI,
};
