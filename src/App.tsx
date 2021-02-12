import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import * as SB from './balancer/simple-balancer';
import * as SBP from './balancer/simple-balancer-pools';
import BigNumber from 'bignumber.js';

const App = () => {
  const [ETHBalance, setETHBalance] = useState<BigNumber>(new BigNumber(0));
  const [WETHBalance, setWETHBalance] = useState<BigNumber>(new BigNumber(0));
  const [WETHAllowance, setWETHAllowance] = useState<BigNumber>(
    new BigNumber(0),
  );
  const [DAIBalance, setDAIBalance] = useState<BigNumber>(new BigNumber(0));
  const [DAIAllowance, setDAIAllowance] = useState<BigNumber>(new BigNumber(0));

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [poolProxy, setPoolProxy] = useState<string>('');
  const [myPools, setMyPools] = useState<any[]>([]);
  const [allPools, setAllPools] = useState<any[]>([]);

  const refreshBalances = useCallback(async () => {
    const [
      ethBalance,
      wethBalance,
      wethAllowance,
      daiBalance,
      daiAllowance,
    ] = await Promise.all([
      SB.getETHBalance(),
      SB.getWETHBalance(),
      SB.getWETHAllowance(),
      SB.getDAIBalance(),
      SB.getDAIAllowance(),
    ]);
    setETHBalance(ethBalance);
    setWETHBalance(wethBalance);
    setWETHAllowance(wethAllowance);
    setDAIBalance(daiBalance);
    setDAIAllowance(daiAllowance);
  }, []);

  const refreshMyPools = useCallback(async () => {
    setMyPools(await SBP.getMyPools());
  }, []);

  const createProxy = async () => {
    setPoolProxy(await SBP.getOrCreateProxy());
  };

  useEffect(() => {
    const init = async () => {
      refreshBalances();
      refreshMyPools();

      const [proxy, pools] = await Promise.all([
        SBP.getProxy(),
        SBP.getPools(),
      ]);

      setPoolProxy(proxy);
      setAllPools(pools);
    };

    init();
  }, [refreshBalances, refreshMyPools]);

  const withLoading = async (fn: Function) => {
    setIsLoading(true);
    await fn();
    setIsLoading(false);
  };

  return (
    <div className="App">
      {isLoading && <h1>Loading...</h1>}
      <button
        onClick={() => {
          SB.unlockMetamask();
        }}>
        Unlock metamask
      </button>
      <button
        onClick={() => {
          withLoading(async () => await SB.swapETHforWETH(0.01));
        }}>
        Swap ETH for WETH
      </button>
      <button
        onClick={() => {
          withLoading(async () => await SB.swapWETHforDai(0.001));
        }}>
        Swap
      </button>
      <h2>
        Balances{' '}
        <button
          onClick={() => {
            withLoading(async () => await refreshBalances());
          }}>
          Refresh
        </button>
      </h2>
      <p>{ETHBalance.toFixed(4)} ETH</p>
      <p>
        {WETHBalance.toFixed(4)} WETH ({WETHAllowance.toFixed(4)}){' '}
        <button onClick={() => withLoading(async () => SB.unlockWETH())}>
          Unlock
        </button>
      </p>
      <p>
        {DAIBalance.toFixed(4)} DAI ({DAIAllowance.toFixed(4)}){' '}
        <button onClick={() => withLoading(async () => SB.unlockDAI())}>
          Unlock
        </button>
      </p>
      <h2>Pool Proxy</h2>
      {poolProxy && <p>{poolProxy}</p>}
      {!poolProxy && (
        <button onClick={() => withLoading(async () => createProxy())}>
          Create proxy
        </button>
      )}
      <h2>
        My pools{' '}
        <button
          onClick={() => {
            withLoading(async () => refreshMyPools());
          }}>
          Refresh
        </button>
      </h2>
      {myPools.map((p) => (
        <div key={p.id}>
          <p>
            {p.id}
            <button
              onClick={() => {
                withLoading(async () => SBP.exitPool(p.id));
              }}>
              Exit Pool
            </button>
          </p>
        </div>
      ))}
      <br />
      <button
        onClick={() => {
          withLoading(async () => SBP.createPool());
        }}>
        Create pool
      </button>
      <h2>All pools (first 20)</h2>
      {allPools.map((p) => (
        <div key={p.id}>
          <p>{p.id}</p>
        </div>
      ))}
    </div>
  );
};

export default App;
