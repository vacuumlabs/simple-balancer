// await window.nep141Xerc20.naturalErc20.sendToNear({
//   amount: amount.value,
//   erc20Address: window.dom.find('erc20Address').value,
//   sender: window.ethUserAddress,
//   recipient: window.nearUserAddress
// })

import { getEthAccount, getNEARAccountId, TST_ADDRESS_ON_ETH } from './common';
import { naturalErc20 } from '@near-eth/nep141-erc20';
import { decorate, get } from '@near-eth/client';

// process.env.ethErc20AbiText = require('../abi/erc20.abi');

export const getCurrentTransfers = async () => {
  const transfers = await get({ filter: (t) => t.status === 'in-progress' });
  const decoratedTransfers = transfers.map((t) =>
    decorate(t, { locale: 'en_US' }),
  );
  return decoratedTransfers;
};

export const swap = async () => {
  const sender = await getEthAccount();
  const recipient = await getNEARAccountId();
  console.log({ sender, recipient, ee: process.env });
  naturalErc20.sendToNear({
    sender,
    recipient,
    erc20Address: TST_ADDRESS_ON_ETH,
    amount: '0.0001',
  });
};
