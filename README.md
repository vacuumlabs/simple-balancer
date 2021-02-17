# Simple Balancer

A Balancer based application which should, as simply as possible, demonstrate how Balancer Exchange operates.

The Balancer part of the app is in the `src/balancer` folder. This folder contains all the Balancer operations:

- `common.tsx` - contains all the contract addresses, ABI constants, `web3` variable and some common functions.
- `simple-balancer.tsx` - contains the main functionality of Balancer Frontend. Function to get asset (WETH/DAI/...) balance and allowance and functions for swapping tokens.
- `simple-balancer-pools.tsx` - contains functionality for pool operations. Create DS Proxy, get a list of my pools, get a list of all the pools, create a pool and completely exit a pool.

The React app serves only to demonstrate the usage of the `balancer` stuff. I tried to keep everything as simple as possible, but it's slowly growing.

## Setup

```
yarn
yarn start
```

If you'd like to receive some GKC1 or GKC2 just send me your address and I will provide you some.

For SOR to work with NEAR and your custom pools you should clone [balancer-sor](https://github.com/vacuumlabs/balancer-sor) and import (or [link](https://classic.yarnpkg.com/en/docs/cli/link/)) the local version in `package.json`.

## Overview

### Swaps

In order to be able to do anything, you first need to have login with NEAR. Do this using the `Login with NEAR` button or the `loginWithNear` function.

After logging in you can get your account balances - by using the `Refresh` button next to balances or by calling the individual `get***Balance/get***Allowance` functions - I've removed ETH, WETH and DAI in the NEAR version.

If you have no GKC1 or GKC2 tokens just send me your address and I will provide you some.

Next to each **Token** balance you can see the allowance for Exchange/DS Proxy - i.e. how much tokens are unlocked. If it's 0, Balancer doesn't have access to those tokens (allowance) and the tokens need to be unlocked - you can again use a button for that or you can use the function calls for that - the function unlocks the tokens for both the exhchange proxy and the DS proxy contract so expect two transactions. For now `MAX_UINT_256` tokens are unlocked, this can easily be changed in the `unlockAsset` function. The `MAX_UINT_256` is the reason why the allowance is so huge after unlocking - sorry, feel free to modify. And again, after unlocking, you need to hit the balances `Refresh` button.

Custom tokens can also be swapped (`swapGKC1forGKC2`) after a pool has been created.

_NOTE: Token swapping is rather slow because fetching the swaps from SOR takes some time._

### Pools

The UI also enables to "manage" your pools. In order to create a pool you first need to have a DS Proxy created for your account. You can use the `Create proxy` button for that.

After you've created your proxy you can create a custom pool. This creates a GKC1 <-> GKC2 pool by default with some fixed amounts of both tokens. This can be modified in the `createCustomPool` function - but be careful to adjust both `balances` and `weights`. You of course need to have the amount of tokens available on your account. After a pool is created you need to manually refresh the list to see it.

**Hacks regarding the pools:**

These are needed until we replace subgraph functionality on NEAR.

After you create a pool check the console output for "DS proxy result:". The pool id (address) can for now be found under `result.events[0].raw.topics[2]`.

For now, SOR needs to be modified to work with this pool. Modify `getAllPublicSwapPools` to return the pool directly. E.g.:

```
return {
  pools: [
      {
          id: '0x6a60ec11b03bc26c0632a7ea6de2c75562f0c657'.toLowerCase(),
          publicSwap: 'true',
          swapFee: '0.000001',
          tokens: [
              {
                  address: '0xE599045A0a93fF901B995c755f1599DB6ACD44e6'.toLowerCase(),
                  balance: '100',
                  decimals: '18',
                  denormWeight: '10',
              },
              {
                  address: '0xc1dd4f43e799A08Ec72b455c723C7FE0e9e85A70'.toLowerCase(),
                  balance: '1000',
                  decimals: '18',
                  denormWeight: '1',
              },
          ],
          tokensList: [
              '0xE599045A0a93fF901B995c755f1599DB6ACD44e6'.toLowerCase(),
              '0xc1dd4f43e799A08Ec72b455c723C7FE0e9e85A70'.toLowerCase(),
          ],
          totalWeight: '11',
      },
  ],
};
```

Also the `result` variable in `multicall.getAllPoolDataOnChain` needs to be modified to contain the token balances.

_NOTE: The pool won't be shown in `My pools` until we figure out a subgraph alternative._

## Contracts used (so far)

### WETH (not deployed to NEAR)

Used for wrapping ETH. The `Swap ETH for WETH` button uses this contract to deposit ETH thus receiving WETH. I haven't yet tried to swap directly from ETH to DAI, but I **think** SOR should be able to handle that.

**`deposit`:**

Passed into `send`:

- `from`
- `value`

### Exchange Proxy

Used to make the actual swaps (in the `swapWETHforDAI` function).

**`multihopBatchSwapExactIn`:** (execute swap)

- `tradeSwaps` (received from SOR)
- `assetInAddress`
- `assetOutAddress`
- `assetInAmount`
- `minAssetOutAmount`.

Passed into `send`:

- `from`

### DS Proxy

A separate instance of this contract is created for each account. Right now it is used only to create a pool. An encoded call to BActions is passed in as parameter and it is called inside the proxy. BActions in turn calls BFactory to create a pool.

### DS Proxy Registry

Used to create and get the specific DS Proxy for the account.

**`build`:** (create proxy)

Passed into `send`:

- `from`

**`proxies`:** (get proxy)

- `account`

### B-Actions

I'm not really what this does yet. Seems like it's another proxy used to call all the underlying Balancer contracts. In this project it's called by DS Proxy to create a pool.

### B-Pool

The last piece in the `DS Proxy` -> `B-Actions` -> `B-Pool` chain to crate a pool. Represents the Balancer pool. Also used to exit the pool.

**`exitPool`:** (remove liquidity from pool)

- `poolAmountIn` - how much BPT you are removing (I am not sure how BPT works so far). As far as I understand it's simply how much % you are taking out.
- `minAmountsOut` - how much of each token you're taking out - I guess if it's 0, you take everything?

### ERC-20

Used for getting asset balance and allowance for a given token and also for "unlocking" the asset i.e. setting allowance for Exchange Proxy.
**`approve`:** (set allowance)

- `address`
- `value`
  Passed into `send`:

- `from`

## Libraries used (so far)

### Web3

Used to call all the contracts.

### Balancer SOR

Used to get the best swap route.

### Bignumber.js

Used for all the amounts.

### json-to-graphql-query

Used to transform subgraph requests.

### lodash

Used to merge subgraph requests.

### Ethers (for Infura provider)

This is used by SOR. We will need to resolve this when porting to NEAR.

## Services used (so far)

### Infura

Used by SOR.

### Subgraph

Used to get pool data.
