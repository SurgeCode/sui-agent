import { streamText, type CoreMessage, tool, type CoreTool } from 'ai';
import { z } from 'zod';
import { instantiateAccount, suiClient, balance, getAllBalances, sendSui } from './sui';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { graphql } from '@mysten/sui/graphql/schemas/latest';
import { Aftermath, Coin } from 'aftermath-ts-sdk';
import { supportedCoins } from './constants';

const gqlClient = new SuiGraphQLClient({
    url: 'https://sui-mainnet.mystenlabs.com/graphql',
  });

export function getTools() {
    const listCoinsTool: CoreTool = tool({
      description: 'Get a list of all supported coins that can be traded through Aftermath DEX',
      parameters: z.object({}),
      execute: async () => {
        return { supportedCoins };
      }
    });

    const sendSuiTool: CoreTool = tool({
      description: 'Send SUI tokens to another address on the Sui blockchain. This tool allows transferring SUI from your wallet to any recipient address. The amount should be specified in MIST units (1 SUI = 1,000,000,000 MIST).',
      parameters: z.object({
        to: z.string().describe('The recipient Sui address to send tokens to'),
        amount: z.number().describe('The amount to send in MIST units')
      }),
      execute: async (args: { to: string; amount: number }) => {
        const keypair = await instantiateAccount(process.env.SUI_PRIVATE_KEY);
        const result = await sendSui(keypair, args.to, args.amount);
        return result;
      }
    });
  
    const swapTool: CoreTool = tool({
      description: 'Execute swaps and get quotes for trades using Aftermath DEX, you need to get the quote first and ask the user to confirm you want to swap, then when its done you need to show the user how much they swapped how much they got',
      parameters: z.object({
        action: z.enum(['getQuote', 'executeSwap']).describe('Action to perform'),
        coinInType: z.string().describe('Input coin type (e.g. "0x2::sui::SUI")'),
        coinOutType: z.string().describe('Output coin type'),
        amount: z.string().describe('Amount to swap in base units'),
        slippage: z.number().optional().describe('Slippage tolerance (e.g. 0.01 for 1%), required for executeSwap')
      }),
      execute: async (args) => {
        const afSdk = new Aftermath("MAINNET");
        await afSdk.init();
        const router = afSdk.Router();
  
        const keypair = await instantiateAccount(process.env.SUI_PRIVATE_KEY);
        const address = keypair.getPublicKey().toSuiAddress();
        const coin = afSdk.Coin();
        // Get decimals for the input coin
        const decimals = await coin.getCoinsToDecimals({
          coins: [args.coinInType]
        });
        
        // Convert input amount to on-chain format
        const normalizedAmount = Coin.normalizeBalance(Number(args.amount), decimals[args.coinInType]);
  
        const route = await router.getCompleteTradeRouteGivenAmountIn({
          coinInType: args.coinInType,
          coinOutType: args.coinOutType,
          coinInAmount: BigInt(normalizedAmount.toString()),
          referrer: address
        });
  
        if (args.action === 'getQuote') {
          return { route };
        }
  
        if (!args.slippage) {
          throw new Error('Slippage parameter is required for swap execution');
        }
  
        const transaction = await router.getTransactionForCompleteTradeRoute({
          walletAddress: address,
          completeRoute: route,
          slippage: args.slippage
        });
  
        const result = await suiClient.signAndExecuteTransaction({
          signer: keypair,
          transaction,
          options: {
            showBalanceChanges: true
          }
        });
  
        return {
          success: true,
          transactionId: result.digest,
          route
        };
      }
    });
  
    const queryBlockchainTool: CoreTool = tool({
      description: 'Query the Sui blockchain using GraphQL to get various information about epochs, transactions, and addresses, you should try display key information that is received not just talk about it, balance for sui native token is alrady in the context so dont try query it.',
      parameters: z.object({
        queryType: z.enum(['chainIdentifier', 'addressInfo', 'transactionInfo', 'recentTransactions']).describe('Type of query to execute'),
        address: z.string().optional().describe('Address to query information for (required for addressInfo)'),
        epochId: z.number().optional().describe('Epoch ID to query (optional for epochInfo)'),
        transactionDigest: z.string().optional().describe('Transaction digest to query (required for transactionInfo)')
      }),
      execute: async (args) => {
        switch (args.queryType) {
          case 'chainIdentifier': {
            const query = graphql(`
              query {
                chainIdentifier
              }
            `);
            const result = await gqlClient.query({ query });
            return { chainIdentifier: result.data?.chainIdentifier };
          }
  
          case 'addressInfo': {
            if (!args.address) throw new Error('Address is required for addressInfo query');
            const query = graphql(`
              query getAddressInfo($address: SuiAddress!) {
                address(address: $address) {
                  defaultSuinsName
                }
              }
            `);
            const result = await gqlClient.query({
              query,
              variables: { address: args.address }
            });
            return { defaultSuinsName: result.data?.address?.defaultSuinsName };
          }
  
          case 'transactionInfo': {
            if (!args.transactionDigest) throw new Error('Transaction digest is required');
            const query = graphql(`
              query getTransactionInfo($digest: String!) {
                transactionBlock(digest: $digest) {
                  gasInput {
                    gasSponsor {
                      address
                    }
                    gasPrice
                    gasBudget
                  }
                  effects {
                    status
                    timestamp
                    checkpoint {
                      sequenceNumber
                    }
                    epoch {
                      epochId
                      referenceGasPrice
                    }
                  }
                }
              }
            `);
            const result = await gqlClient.query({
              query,
              variables: { digest: args.transactionDigest }
            });
            return result.data?.transactionBlock;
          }
  
          case 'recentTransactions': {
            const query = graphql(`
              query {
                transactionBlocks(last: 10, filter: {kind: PROGRAMMABLE_TX}) {
                  nodes {
                    digest
                    kind {
                      __typename
                    }
                  }
                }
              }
            `);
            const result = await gqlClient.query({ query });
            return result.data?.transactionBlocks?.nodes;
          }
        }
      }
    });

    const getAllBalancesTool: CoreTool = tool({
      description: 'Get all coin balances for a given address on the Sui blockchain',
      parameters: z.object({
        address: z.string().describe('The Sui address to get balances for')
      }),
      execute: async (args: { address: string }) => {
        const balances = await getAllBalances(args.address);
        const afSdk = new Aftermath("MAINNET");
        await afSdk.init();
        const coin = afSdk.Coin();
       
        const coinTypes = balances.map(b => b.coinType);
        const decimals = await coin.getCoinsToDecimals({ coins: coinTypes });
        
        const formattedBalances = balances.map(b => {
          const decimal = decimals[b.coinType];
          const normalizedBalance = Number(b.totalBalance) / Math.pow(10, decimal);
          
          return {
            ...b,
            normalizedBalance
          };
        });
        
        return { balances: formattedBalances };
      }
    });
  
    return {
      sendSui: sendSuiTool,
      queryBlockchain: queryBlockchainTool,
      listCoins: listCoinsTool,
      swapTool: swapTool,
      getAllBalances: getAllBalancesTool
    };
  }