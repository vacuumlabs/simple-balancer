import Web3 from 'web3';
import BigNumber from 'bignumber.js';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export const MAX_UINT_256 = new BigNumber(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
);
export const TOKEN_PRECISION = 18;

// TOKENS
export const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const WETH_ADDRESS = '0xd0A1E359811322d97991E03f863a0C30C2cF029C';

export const DAI_ADDRESS = '0x1528F3FCc26d13F7079325Fb78D9442607781c8C';

export const GKC1_ADDRESS = '0xAEBA7119655e768E10Be04d51621d8E1d443d55E';
export const GKC2_ADDRESS = '0x71660D8a7508dd878B9E1823d2918aF42B0ccE97';

// CONTRACT ADDRESSES
export const EXCHANGE_PROXY_ADDRESS =
  '0x4e67bf5bD28Dd4b570FBAFe11D0633eCbA2754Ec';
export const DS_PROXY_REGISTRY_ADDRESS =
  '0x130767E0cf05469CF11Fa3fcf270dfC1f52b9072';
export const B_ACTIONS_ADDRESS = '0xeACBe91fE3F8eF6086027AEC0127De982205b1Aa';
export const B_FACTORY_ADDRESS = '0x8f7F78080219d4066A8036ccD30D588B416a40DB';
// MY CONTRACT ADDRESSES
// export const EXCHANGE_PROXY_ADDRESS =
//   '0xd614090E20B795ed2987749f6Efde102464FBBE6';
// export const DS_PROXY_REGISTRY_ADDRESS =
//   '0x306812E8871bF5C4A04e2383634EF13b6D329E6B';
// export const B_ACTIONS_ADDRESS = '0xbC9662CC53b9d0834A0Be56410d9FF869919994D';
// export const B_FACTORY_ADDRESS = '0x600Ba3468FbdA19f7E4817CF47Fd21C068Bf80d1';

// ABIs
export const ERC20Abi = require('../abi/ERC20.json');
export const ExchangeProxyAbi = require('../abi/ExchangeProxy.json');
export const DSProxyAbi = require('../abi/DSProxy.json');
export const DSProxyRegistryAbi = require('../abi/DSProxyRegistry.json');
export const BActionsAbi = require('../abi/BActions.json');
export const BPoolAbi = require('../abi/BPool.json');
export const WETHAbi = require('../abi/Weth.json');

// COMMON VARIABLES/FUNCTIONS
export const web3 = new Web3(Web3.givenProvider);

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
