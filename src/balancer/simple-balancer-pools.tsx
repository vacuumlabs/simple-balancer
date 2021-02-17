import BigNumber from 'bignumber.js';
import { merge, cloneDeep } from 'lodash';
import queries from '../queries.json';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import {
  TOKEN_PRECISION,
  ZERO_ADDRESS,
  GKC1_ADDRESS,
  GKC2_ADDRESS,
  DS_PROXY_REGISTRY_ADDRESS,
  B_ACTIONS_ADDRESS,
  B_FACTORY_ADDRESS,
  DSProxyAbi,
  DSProxyRegistryAbi,
  BActionsAbi,
  BPoolAbi,
  getAccount,
  web3,
  scale,
  toWei,
} from './common';

const getProxy = async (): Promise<string> => {
  try {
    console.log('Get proxy');

    const dsProxyRegistryContract = new web3.eth.Contract(
      DSProxyRegistryAbi.abi,
      DS_PROXY_REGISTRY_ADDRESS,
    );

    const account = await getAccount();
    const proxyAddress = await dsProxyRegistryContract.methods
      .proxies(account)
      .call();

    console.log(`Received proxy ${proxyAddress}`);

    return proxyAddress === ZERO_ADDRESS ? '' : proxyAddress;
  } catch (e) {
    console.log('Get proxy error:', e);
    throw e;
  }
};

const createProxy = async (): Promise<string> => {
  const account = await getAccount();

  console.log(`Create proxy for account ${account}`);

  const dsProxyRegistryContract = new web3.eth.Contract(
    DSProxyRegistryAbi.abi,
    DS_PROXY_REGISTRY_ADDRESS,
  );

  await dsProxyRegistryContract.methods.build().send({ from: account });
  const proxyAddress = await dsProxyRegistryContract.methods
    .proxies(account)
    .call();

  console.log(`Created proxy ${proxyAddress}`);

  return proxyAddress;
};

const getOrCreateProxy = async (): Promise<string> => {
  console.log('Get or create proxy');
  try {
    let proxyAddress = await getProxy();

    if (proxyAddress === '') {
      proxyAddress = await createProxy();
    }

    return proxyAddress;
  } catch (e) {
    console.log('Get or create proxy error:', e);
    throw e;
  }
};

const getMyPools = async (): Promise<any> => {
  console.log('Get my pools');

  const poolShares = await getPoolShares();
  const query = {
    pools: {
      __args: {
        where: {
          id_in: poolShares.map((ps: any) => ps.poolId.id),
          tokensList_not: [],
        },
        first: 20,
        page: 1,
        orderBy: 'liquidity',
        orderDirection: 'desc',
      },
    },
  };

  console.log('Get my pools from subgraph', { query });
  let { pools } = await subgraphRequest('getPools', query);
  console.log('Received my pools:', { pools });
  return pools;
};

const getPools = async (): Promise<any> => {
  console.log('Get pools');
  const query = {
    pools: {
      __args: {
        where: {
          tokensList_not: [],
        },
        first: 20,
        page: 1,
        orderBy: 'liquidity',
        orderDirection: 'desc',
      },
    },
  };

  console.log('Get pools from subgraph', { query });
  let { pools } = await subgraphRequest('getPools', query);
  console.log('Received pools:', { pools });
  return pools;
};

const getPoolShares = async (): Promise<any> => {
  console.log('Get pool shares');
  const query = {
    poolShares: {
      __args: {
        where: {
          userAddress: (await getAccount()).toLowerCase(),
        },
      },
    },
  };
  console.log('Get pool shares from subgraph', { query });
  const { poolShares } = await subgraphRequest('getUserPoolShares', query);
  console.log('Received pool shares:', { poolShares });
  return poolShares;
};

const subgraphRequest = async (
  key: string | null,
  jsonQuery: any = {},
): Promise<any> => {
  jsonQuery = key
    ? merge(cloneDeep(queries[key]), cloneDeep(jsonQuery))
    : jsonQuery;
  const query =
    typeof jsonQuery === 'string'
      ? jsonQuery
      : jsonToGraphQLQuery({ query: jsonQuery });
  const res = await fetch(
    'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-kovan',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    },
  );
  try {
    const { data } = await res.json();
    return data;
  } catch (e) {
    console.log('Subgraph request error:', e);
    return null;
  }
};

const createCustomPool = async () => {
  console.log('Create pool');
  try {
    const proxyAddress = await getOrCreateProxy();

    const tokens = [GKC1_ADDRESS, GKC2_ADDRESS];
    const balances = ['100000000000000000000', '1000000000000000000000']; // 100 GKC1, 1000 GKC2
    const weights = ['10000000000000000000', '1000000000000000000']; // 10:1
    const swapFee = '0.10';

    // web3.eth.abi.encodeFunctionCall didn't work because only
    //    string parameters are supported for some reason
    const createPoolFunctionAbi = BActionsAbi.abi[2];
    const data =
      web3.eth.abi.encodeFunctionSignature(createPoolFunctionAbi) +
      web3.eth.abi
        .encodeParameters(createPoolFunctionAbi.inputs, [
          B_FACTORY_ADDRESS,
          tokens,
          balances,
          weights,
          scale(new BigNumber(swapFee), TOKEN_PRECISION - 2).toString(),
          'true',
        ])
        .replace('0x', '');

    console.log('Create pool encoded data:', { data });
    const dsProxyContract = new web3.eth.Contract(DSProxyAbi.abi, proxyAddress);

    const account = await getAccount();
    console.log('Executing DS proxy contract');
    const result = await dsProxyContract.methods
      .execute(B_ACTIONS_ADDRESS, data)
      .send({ from: account });

    console.log('DS proxy result: ', { result });
  } catch (e) {
    console.log('DS proxy error:', e);
  }
};

const exitPool = async (poolId: string) => {
  console.log(`Exit pool ${poolId}`);
  try {
    const bPoolContract = new web3.eth.Contract(BPoolAbi.abi, poolId);

    const account = await getAccount();
    // exit everything
    const result = await bPoolContract.methods
      .exitPool(toWei('100').toString(), ['0', '0'])
      .send({ from: account });

    console.log('Exit pool result:', { result });
  } catch (e) {
    console.log('Exit pool error', e);
  }
};

export {
  getOrCreateProxy,
  getMyPools,
  getPools,
  getPoolShares,
  exitPool,
  getProxy,
  createProxy,
  createCustomPool,
};
