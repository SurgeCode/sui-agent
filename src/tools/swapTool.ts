import { tool } from "ai";
import { z } from "zod";
import { instantiateAccount, suiClient } from "../sui";
import { Aftermath, Coin } from "aftermath-ts-sdk";

export const swapTool = tool({
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
}); 