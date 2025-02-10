import { tool } from "ai";
import { z } from "zod";
import { OnChainCalls, QueryChain, ISwapParams } from "@firefly-exchange/library-sui/dist/src/spot";
import { Ed25519Keypair, toBigNumber, SuiClient } from "@firefly-exchange/library-sui";
import { mainnet } from "./constants";

const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io:443" });

export const bluefinTool = tool({
  description: `Execute spot trades on Bluefin DEX. Supports swapping assets with configurable slippage, use this ${mainnet.Pools} to see whats available and get the right addresses based on user intent.`,
  parameters: z.object({
    poolId: z.string().describe("The ID of the pool to trade on"),
    amount: z.number().describe("Amount to swap"),
    aToB: z.boolean().describe("If true, swap first token for second token, if false then reverse"),
    byAmountIn: z.boolean().describe("If true, amount is input amount, if false then output amount"), 
    slippage: z.number().describe("Slippage tolerance between 0 and 1 (e.g. 0.1 for 10%)")
  }),
  execute: async (args) => {
    if (!process.env.SUI_PRIVATE_KEY) {
      throw new Error("SUI_PRIVATE_KEY environment variable is required");
    }

    const signer = Ed25519Keypair.fromSecretKey(Buffer.from(process.env.SUI_PRIVATE_KEY, 'hex'));
    const oc = new OnChainCalls(client, mainnet, {signer: signer});
    const qc = new QueryChain(client);

    const poolState = await qc.getPool(args.poolId);
    const iSwapParams: ISwapParams = {
      pool: poolState,
      amountIn: args.byAmountIn ? toBigNumber(args.amount, (args.aToB ? poolState.coin_a.decimals : poolState.coin_b.decimals)) : 0,
      amountOut: args.byAmountIn ? 0 : toBigNumber(args.amount, (args.aToB ? poolState.coin_b.decimals : poolState.coin_a.decimals)),
      aToB: args.aToB,
      byAmountIn: args.byAmountIn,
      slippage: args.slippage
    };

    try {
      const result = await oc.swapAssets(iSwapParams);
      return {
        success: true,
        result,
        params: {
          poolId: args.poolId,
          amount: args.amount,
          aToB: args.aToB,
          byAmountIn: args.byAmountIn,
          slippage: args.slippage
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        params: {
          poolId: args.poolId,
          amount: args.amount,
          aToB: args.aToB,
          byAmountIn: args.byAmountIn,
          slippage: args.slippage
        }
      };
    }
  }
});