import { tool } from "ai";
import { z } from "zod";
import { instantiateAccount, suiClient } from "./sui-utils";
import { Aftermath, Coin } from "aftermath-ts-sdk";
import { supportedCoins } from "./constants";

export const swapTool = tool({
  description:
    "Execute swaps and get quotes for trades using Aftermath DEX. First get a quote using action='getQuote' to preview the swap, then execute with action='executeSwap'. For coinInType and coinOutType, use one of these supported addresses: " + supportedCoins.join(", ") + ". After getting a quote, confirm you want to proceed before executing the swap. The response will show the input and output amounts.",
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

    const amountBigInt = BigInt(args.amount);
    console.log(args.coinInType, args.coinOutType, amountBigInt)
    const route = await router.getCompleteTradeRouteGivenAmountIn({
      coinInType: args.coinInType,
      coinOutType: args.coinOutType,
      coinInAmount: amountBigInt,
      referrer: address
    });

    if (args.action === "getQuote") {
      return { route };
    }

    if (!args.slippage) {
      throw new Error("Slippage parameter is required for swap execution");
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
  },
});