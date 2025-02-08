import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { MIST_PER_SUI } from '@mysten/sui/utils';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';

dotenv.config();

export const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });

interface SuiBalance {
  totalBalance: string;
}

interface CoinBalance {
  coinType: string;
  totalBalance: string;
  coinObjectCount: number;
}

export const balance = (balance: SuiBalance): number => {
  return Number.parseInt(balance.totalBalance) / Number(MIST_PER_SUI);
};

export const getAllBalances = async (address: string): Promise<CoinBalance[]> => {
  const response = await fetch(getFullnodeUrl('mainnet'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'suix_getAllBalances',
      params: [address]
    })
  });

  const data = await response.json();
  return data.result;
};

export const instantiateAccount = async (privateKey?: string): Promise<Ed25519Keypair> => {
  if (privateKey) {
    return Ed25519Keypair.fromSecretKey(privateKey);
  }
  return new Ed25519Keypair();
};

export const sendSui = async (
  senderKeypair: Ed25519Keypair,
  recipientAddress: string,
  amountInMist: number
) => {
  const senderAddress = senderKeypair.getPublicKey().toSuiAddress();

  // Get sender's initial balance
  const senderBalance = await suiClient.getBalance({
    owner: senderAddress,
  });

  const tx = new Transaction();
  const [coin] = tx.splitCoins(tx.gas, [amountInMist]);
  tx.transferObjects([coin], recipientAddress);

  const result = await suiClient.signAndExecuteTransaction({
    signer: senderKeypair,
    transaction: tx,
    options: {
      showBalanceChanges: true
    }
  });

  await suiClient.waitForTransaction({ digest: result.digest });

  const finalSenderBalance = await suiClient.getBalance({
    owner: senderAddress,
  });
  const recipientBalance = await suiClient.getBalance({
    owner: recipientAddress,
  });

  return {
    digest: result.digest,
    senderInitialBalance: balance(senderBalance),
    senderFinalBalance: balance(finalSenderBalance),
    recipientBalance: balance(recipientBalance),
    recipientAddress
  };
};
