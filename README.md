# Simple Balancer

A Balancer based application which should, as simply as possible, demonstrate how Balancer Exchange operates.

The Balancer part of the app is in the `src/balancer` folder. This folder contains all the Balancer operations:

- `common.tsx` - contains all the contract addresses, ABI constants, `web3` variable and some common functions.
- `simple-balancer.tsx` - contains the main functionality of Balancer Frontend. Function to get asset (WETH/DAI/...) balance and allowance and functions for swapping tokens.
- `simple-balancer-pools.tsx` - contains functionality for pool operations. Create DS Proxy, get a list of my pools, get a list of all the pools, create a pool and completely exit a pool.

The React app serves only to demonstrate the usage of the `balancer` stuff. I tried to keep everything as simple as possible, but it's slowly growing.

## TODO

- [x] login with metamask
  - [x] unlock metamask - in order to get accounts
- [x] show account balance
  - [x] show as formatted number
- [x] load SOR pools
- [x] make simple, fixed trade
- [x] swap eth for WETH and DAI
- [x] unlock tokens
- [x] create pool
- [x] get pools
- [x] exit pool
- [x] add logging
- [x] add README
- [ ] try swapping ETH directly for DAI
- [ ] create custom tokens
- [ ] swap custom tokens
- [ ] repeat with our own contracts
  - [ ] swap eth for custom tokens
  - [ ] create pool with custom tokens
  - [ ] make simple trade with custom tokens
- [ ] repeat for NEAR

## Overview

### Swaps

In order to be able to do anything, you first need to have Metamask unlocked. Do this using the `Unlock metamask` button or the `unlockMetamask` function.

After unlocking Metamask you can get your account balances - by using the `Refresh` button next to balances or by calling the individual `get***Balance/get***Allowance` functions.

If you have no tokens you can use the `Swap ETH for WETH` button to, well, swap your ETH for WETH. By default `0.1` ETH is exchanged (this can be changed in the UI code). This should trigger a transaction, opening Metamask and requesting you to accept the transaction. After the transaction is done (the `Loading...` text should disappear) you need to hit the balances `Refresh` button again (I'm not refreshing automatically to keep it as simple as possible).

Next to each **Token** balance (not ETH) you can see the allowance for Exchange Proxy - i.e. how much tokens are unlocked. If it's 0, Balancer doesn't have access to those tokens (allowance) and the tokens need to be unlocked - you can again use a button for that or you can use the function calls for that. For now `MAX_UINT_256` tokens are unlocked, this can easily be changed in the `unlockAsset` function. The `MAX_UINT_256` is the reason why the allowance is so huge after unlocking - sorry, feel free to modify. And again, after unlocking, you need to hit the balances `Refresh` button.

To swap WETH for DAI you can use the `Swap` button. By default, this swaps _0.001 WETH_ for an amount of DAI returned by SOR.

_NOTE: Token swapping is rather slow because fetching the swaps from SOR takes some time._

### Pools

The UI also enables to "manage" your pools. In order to create a pool you first need to have a DS Proxy created for your account. You can use the `Create proxy` button for that.

After you've created your proxy you can create a pool. This creates a WETH <-> DAI pool by default with some fixed amounts of both tokens. This can be modified in the `createPool` function - but be careful to adjust both `balances` and `weights`. You of course need to have the amount of tokens available on your account. After a pool is created you need to manually refresh the list to see it.

_NOTE: It can take about a minute for your new pool to appear in the list - so just try refreshing a couple of times._

You can also exit the pool by clicking the button next to it. This frees all your tokens.

## Contracts used (so far)

### WETH

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
