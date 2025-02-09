import { streamText, type CoreMessage, tool, type CoreTool } from "ai";
import { z } from "zod";
import { instantiateAccount, suiClient, getAllBalances, sendSui } from "./sui";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { Aftermath, Coin } from "aftermath-ts-sdk";
import { supportedCoins } from "./constants";
import { LstClient } from "@suilend/springsui-sdk";
import { Transaction } from "@mysten/sui/transactions";
import { NAVISDKClient } from "navi-sdk";

const gqlClient = new SuiGraphQLClient({
  url: "https://sui-mainnet.mystenlabs.com/graphql",
});

export interface ToolMetadata {
  name: string;
  description: string;
  tool: CoreTool;
}

export type ToolsRegistry = Record<string, ToolMetadata>;

export function getToolKeys(): string[] {
  const toolsRegistry = getTools();
  return Object.keys(toolsRegistry);
}

export function getTools(selectedTools?: string[]) {
  const toolsRegistry: ToolsRegistry = {
    naviTool: {
      name: "NAVI Protocol",
      description:
        "Supply, withdraw, borrow, repay and claim rewards on NAVI protocol",
      tool: tool({
        description:
          "Interact with NAVI protocol to supply tokens, withdraw tokens, borrow, repay or claim rewards",
        parameters: z.object({
          action: z
            .enum(["supply", "withdraw", "borrow", "repay", "claim"])
            .describe("Action to perform on NAVI"),
          coinType: z
            .enum([
              "Sui",
              "NAVX",
              "vSui", 
              "USDT",
              "USDC",
              "WETH",
              "CETUS",
              "haSui",
              "WBTC",
              "AUSD",
            ])
            .optional()
            .describe("Coin type to interact with"),
          amount: z.string().optional().describe("Amount in base units"),
        }),
        execute: async (args) => {
          const keypair = await instantiateAccount(process.env.SUI_PRIVATE_KEY);
          const client = new NAVISDKClient({
            privateKeyList: [keypair.getSecretKey().toString()],
          });
          const account = client.accounts[0];

          const {
            Sui,
            NAVX,
            vSui,
            USDT,
            WETH,
            CETUS,
            haSui,
            WBTC,
            AUSD,
            wUSDC,
          } = await import("navi-sdk");

          const coinMap: { [key: string]: any } = {
            Sui,
            NAVX,
            vSui,
            USDT,
            WETH,
            CETUS,
            haSui,
            WBTC,
            AUSD,
            wUSDC,
          };

          let result;
          switch (args.action) {
            case "supply":
              if (!args.coinType || !args.amount) {
                throw new Error("Coin type and amount required for supply");
              }
              result = await account.depositToNavi(
                coinMap[args.coinType],
                Number(args.amount)
              );
              return result;

            case "withdraw":
              if (!args.coinType || !args.amount) {
                throw new Error("Coin type and amount required for withdraw");
              }
              result = await account.withdraw(
                coinMap[args.coinType],
                Number(args.amount)
              );
              return result;

            case "borrow":
              if (!args.coinType || !args.amount) {
                throw new Error("Coin type and amount required for borrow");
              }
              result = await account.borrow(coinMap[args.coinType], Number(args.amount));
              return result;

            case "repay":
              if (!args.coinType || !args.amount) {
                throw new Error("Coin type and amount required for repay");
              }
              result = await account.repay(coinMap[args.coinType], Number(args.amount));
              return result;

            case "claim":
              result = await account.claimAllRewards();
              return result;

            default:
              throw new Error("Invalid action specified");
          }
        },
      }),
    },

    sendSui: {
      name: "Send SUI",
      description: "Transfer SUI tokens to other addresses",
      tool: tool({
        description:
          "Send SUI tokens to another address on the Sui blockchain. This tool allows transferring SUI from your wallet to any recipient address. The amount should be specified in MIST units (1 SUI = 1,000,000,000 MIST).",
        parameters: z.object({
          to: z
            .string()
            .describe("The recipient Sui address to send tokens to"),
          amount: z.number().describe("The amount to send in MIST units"),
        }),
        execute: async (args: { to: string; amount: number }) => {
          const keypair = await instantiateAccount(process.env.SUI_PRIVATE_KEY);
          const result = await sendSui(keypair, args.to, args.amount);
          return result;
        },
      }),
    },

    liquidStaking: {
      name: "Liquid Staking",
      description: "Mint or redeem sSUI tokens", 
      tool: tool({
        description: "Mint or redeem sSUI tokens using Spring protocol",
        parameters: z.object({
          action: z
            .enum(["mint", "redeem"])
            .describe("Whether to mint or redeem sSUI"),
          amount: z.number().describe("Amount in MIST units"),
        }),
        execute: async (args: {
          action: "mint" | "redeem";
          amount: number;
        }) => {
          const LIQUID_STAKING_INFO = {
            id: "0x15eda7330c8f99c30e430b4d82fd7ab2af3ead4ae17046fcb224aa9bad394f6b",
            type: "0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::spring_sui::SPRING_SUI",
            weightHookId:
              "0xbbafcb2d7399c0846f8185da3f273ad5b26b3b35993050affa44cfa890f1f144",
          };

          const keypair = await instantiateAccount(process.env.SUI_PRIVATE_KEY);
          const lstClient = await LstClient.initialize(
            suiClient,
            LIQUID_STAKING_INFO
          );

          const tx = new Transaction();

          if (args.action === "mint") {
            const mistAmount = Math.floor(args.amount);
            const [sui] = tx.splitCoins(tx.gas, [mistAmount]);
            const sSui = lstClient.mint(tx, sui);
            tx.transferObjects([sSui], keypair.toSuiAddress());
          } else {
            const lstCoins = await suiClient.getCoins({
              owner: keypair.toSuiAddress(),
              coinType: LIQUID_STAKING_INFO.type,
              limit: 1000,
            });

            if (lstCoins.data.length > 1) {
              tx.mergeCoins(
                lstCoins.data[0].coinObjectId,
                lstCoins.data.slice(1).map((c) => c.coinObjectId)
              );
            }

            const mistAmount = Math.floor(args.amount);
            const [lst] = tx.splitCoins(lstCoins.data[0].coinObjectId, [mistAmount]);
            const sui = lstClient.redeem(tx, lst);
            tx.transferObjects([sui], keypair.toSuiAddress());
          }

          const result = await suiClient.signAndExecuteTransaction({
            transaction: tx,
            signer: keypair,
            options: {
              showEvents: true,
              showEffects: true,
              showObjectChanges: true,
            },
          });

          return {
            success: true,
            transactionId: result.digest,
            action: args.action,
          };
        },
      }),
    },

    queryBlockchain: {
      name: "Query Blockchain",
      description:
        "Get information about transactions, addresses, and network status",
      tool: tool({
        description:
          "Query the Sui blockchain using GraphQL to get various information about epochs, transactions, and addresses, you should try display key information that is received not just talk about it, balance for sui native token is alrady in the context so dont try query it.",
        parameters: z.object({
          queryType: z
            .enum([
              "chainIdentifier",
              "addressInfo",
              "transactionInfo",
              "recentTransactions",
            ])
            .describe("Type of query to execute"),
          address: z
            .string()
            .optional()
            .describe(
              "Address to query information for (required for addressInfo)"
            ),
          epochId: z
            .number()
            .optional()
            .describe("Epoch ID to query (optional for epochInfo)"),
          transactionDigest: z
            .string()
            .optional()
            .describe(
              "Transaction digest to query (required for transactionInfo)"
            ),
        }),
        execute: async (args) => {
          switch (args.queryType) {
            case "chainIdentifier": {
              const query = graphql(`
                query {
                  chainIdentifier
                }
              `);
              const result = await gqlClient.query({ query });
              return { chainIdentifier: result.data?.chainIdentifier };
            }

            case "addressInfo": {
              if (!args.address)
                throw new Error("Address is required for addressInfo query");
              const query = graphql(`
                query getAddressInfo($address: SuiAddress!) {
                  address(address: $address) {
                    defaultSuinsName
                  }
                }
              `);
              const result = await gqlClient.query({
                query,
                variables: { address: args.address },
              });
              return {
                defaultSuinsName: result.data?.address?.defaultSuinsName,
              };
            }

            case "transactionInfo": {
              if (!args.transactionDigest)
                throw new Error("Transaction digest is required");
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
                variables: { digest: args.transactionDigest },
              });
              return result.data?.transactionBlock;
            }

            case "recentTransactions": {
              const query = graphql(`
                query {
                  transactionBlocks(
                    last: 10
                    filter: { kind: PROGRAMMABLE_TX }
                  ) {
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
        },
      }),
    },

    listCoins: {
      name: "List Available Coins",
      description: "View all supported coins on Aftermath DEX",
      tool: tool({
        description:
          "Get a list of all supported coins that can be traded through Aftermath DEX",
        parameters: z.object({}),
        execute: async () => {
          return { supportedCoins };
        },
      }),
    },

    swapTool: {
      name: "Swap Tokens",
      description: "Get quotes and execute token swaps on Aftermath DEX",
      tool: tool({
        description:
          "Execute swaps and get quotes for trades using Aftermath DEX, you need to get the quote first and ask the user to confirm you want to swap, then when its done you need to show the user how much they swapped how much they got",
        parameters: z.object({
          action: z
            .enum(["getQuote", "executeSwap"])
            .describe("Action to perform"),
          coinInType: z
            .string()
            .describe('Input coin type (e.g. "0x2::sui::SUI")'),
          coinOutType: z.string().describe("Output coin type"),
          amount: z.string().describe("Amount to swap in base units"),
          slippage: z
            .number()
            .optional()
            .describe(
              "Slippage tolerance (e.g. 0.01 for 1%), required for executeSwap"
            ),
        }),
        execute: async (args) => {
          const afSdk = new Aftermath("MAINNET");
          await afSdk.init();
          const router = afSdk.Router();

          const keypair = await instantiateAccount(process.env.SUI_PRIVATE_KEY);
          const address = keypair.getPublicKey().toSuiAddress();
          const coin = afSdk.Coin();
          const decimals = await coin.getCoinsToDecimals({
            coins: [args.coinInType],
          });

          const normalizedAmount = Coin.normalizeBalance(
            Number(args.amount),
            decimals[args.coinInType]
          );

          const route = await router.getCompleteTradeRouteGivenAmountIn({
            coinInType: args.coinInType,
            coinOutType: args.coinOutType,
            coinInAmount: BigInt(normalizedAmount.toString()),
            referrer: address,
          });

          if (args.action === "getQuote") {
            return { route };
          }

          if (!args.slippage) {
            throw new Error(
              "Slippage parameter is required for swap execution"
            );
          }

          const transaction = await router.getTransactionForCompleteTradeRoute({
            walletAddress: address,
            completeRoute: route,
            slippage: args.slippage,
          });

          const result = await suiClient.signAndExecuteTransaction({
            signer: keypair,
            transaction,
            options: {
              showBalanceChanges: true,
            },
          });

          return {
            success: true,
            transactionId: result.digest,
            route,
          };
        },
      }),
    },

    getAllBalances: {
      name: "Check Balances",
      description: "View all token balances for any address",
      tool: tool({
        description:
          "Get all coin balances for a given address on the Sui blockchain",
        parameters: z.object({
          address: z.string().describe("The Sui address to get balances for"),
        }),
        execute: async (args: { address: string }) => {
          const balances = await getAllBalances(args.address);
          const afSdk = new Aftermath("MAINNET");
          await afSdk.init();
          const coin = afSdk.Coin();

          const coinTypes = balances.map((b) => b.coinType);
          const decimals = await coin.getCoinsToDecimals({ coins: coinTypes });

          const formattedBalances = balances.map((b) => {
            const decimal = decimals[b.coinType];
            const normalizedBalance =
              Number(b.totalBalance) / Math.pow(10, decimal);

            return {
              ...b,
              normalizedBalance,
            };
          });

          return { balances: formattedBalances };
        },
      }),
    },
    getPrices: {
      name: "Check Prices",
      description: "Get real-time cryptocurrency prices and market data",
      tool: tool({
        description:
          "Retrieve current prices and optional 24-hour price changes for cryptocurrencies on the Sui network. Can query either a single coin or multiple coins simultaneously.",
        parameters: z.object({
          action: z
            .enum(["singleCoin", "multipleCoins"])
            .describe(
              "Whether to fetch price for a single coin or multiple coins"
            ),
          coins: z
            .array(z.string())
            .min(1)
            .describe(
              'Array of coin types to get prices for (e.g. ["0x2::sui::SUI"])'
            ),
          detailed: z
            .boolean()
            .optional()
            .default(false)
            .describe(
              "If true, includes 24h price changes and additional market data"
            ),
        }),
        execute: async ({ action, coins, detailed }) => {
          const afSdk = new Aftermath("MAINNET");
          await afSdk.init();
          const prices = afSdk.Prices();

          const isSingleCoin = action === "singleCoin";
          const coin = coins?.[0];

          const priceMethodMap = {
            detailed: {
              singleCoin: () => prices.getCoinPriceInfo({ coin }),
              multipleCoins: () => prices.getCoinsToPriceInfo({ coins }),
            },
            basic: {
              singleCoin: () => prices.getCoinPrice({ coin }),
              multipleCoins: () => prices.getCoinsToPrice({ coins }),
            },
          };

          const methodType = detailed ? "detailed" : "basic";
          const coinType = isSingleCoin ? "singleCoin" : "multipleCoins";
          const priceData = await priceMethodMap[methodType][coinType]();

          const resultKey = `${detailed ? "priceInfo" : "price"}${
            !isSingleCoin ? "s" : ""
          }`;

          return { [resultKey]: priceData };
        },
      }),
    },
  };

  if (selectedTools) {
    const filteredTools = Object.entries(toolsRegistry)
      .filter(([key]) => selectedTools.includes(key))
      .reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value.tool,
        }),
        {}
      );

    return filteredTools;
  }

  // Otherwise return all tools
  return Object.entries(toolsRegistry).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value.tool,
    }),
    {}
  );
}
