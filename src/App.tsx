import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import * as SB from './balancer/simple-balancer';
import * as SBP from './balancer/simple-balancer-pools';
import BigNumber from 'bignumber.js';
import { getAccount } from './balancer/common';

const App = () => {
  const [account, setAccount] = useState<string>('');

  const [GKC1Balance, setGKC1Balance] = useState<BigNumber>(new BigNumber(0));
  const [GKC1Allowance, setGKC1Allowance] = useState<BigNumber>(
    new BigNumber(0),
  );
  const [GKC2Balance, setGKC2Balance] = useState<BigNumber>(new BigNumber(0));
  const [GKC2Allowance, setGKC2Allowance] = useState<BigNumber>(
    new BigNumber(0),
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [poolProxy, setPoolProxy] = useState<string>('');
  const [myPools, setMyPools] = useState<any[]>([]);
  const [allPools, setAllPools] = useState<any[]>([]);

  const refreshBalances = useCallback(async () => {
    const [
      gkc1Balance,
      gkc1Allowance,
      gkc2Balance,
      gkc2Allowance,
    ] = await Promise.all([
      SB.getGKC1Balance(),
      SB.getGKC1Allowance(),
      SB.getGKC2Balance(),
      SB.getGKC2Allowance(),
    ]);
    setGKC1Balance(gkc1Balance);
    setGKC1Allowance(gkc1Allowance);
    setGKC2Balance(gkc2Balance);
    setGKC2Allowance(gkc2Allowance);
  }, []);

  const refreshMyPools = useCallback(async () => {
    setMyPools(await SBP.getMyPools());
  }, []);

  const createProxy = async () => {
    setPoolProxy(await SBP.getOrCreateProxy());
  };

  useEffect(() => {
    const init = async () => {
      if (!account) {
        // setAccount(await getAccount());
        return;
      }

      refreshBalances();
      // refreshMyPools();

      // const [proxy, pools] = await Promise.all([
      //   SBP.getProxy(),
      //   SBP.getPools(),
      // ]);

      // setPoolProxy(proxy);
      // setAllPools(pools);
    };

    init();
  }, [account, refreshBalances, refreshMyPools]);

  const withLoading = async (fn: Function) => {
    setIsLoading(true);
    await fn();
    setIsLoading(false);
  };

  if (!account) {
    return (
      <div className="App">
        {isLoading && <h1>Loading...</h1>}
        <button
          onClick={() => {
            withLoading(async () => {
              await SB.loginWithNear();
              setAccount(await getAccount());
            });
          }}>
          Login with NEAR
        </button>
      </div>
    );
  }

  return (
    <div className="App">
      {isLoading && <h1>Loading...</h1>}
      <h1>{account}</h1>
      <button
        onClick={() => {
          withLoading(async () => await SB.swapGKC1forGKC2(0.01));
        }}>
        Swap GKC1 for GKC2
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
      <p>
        {GKC1Balance.toFixed(4)} GKC1 ({GKC1Allowance.toFixed(4)}){' '}
        <button onClick={() => withLoading(async () => SB.unlockGKC1())}>
          Unlock
        </button>
      </p>
      <p>
        {GKC2Balance.toFixed(4)} GKC2 ({GKC2Allowance.toFixed(4)}){' '}
        <button onClick={() => withLoading(async () => SB.unlockGKC2())}>
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
          withLoading(async () => SBP.createCustomPool());
        }}>
        Create custom pool
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
