import { tool } from "ai";
import { z } from "zod";
import { instantiateAccount, suiClient } from "./sui-utils";
import CetusClmmSDK, {
  adjustForSlippage,
  initCetusSDK,
  d,
  TickMath,
  ClmmPoolUtil,
  Percentage,
} from '@cetusprotocol/cetus-sui-clmm-sdk';
// @ts-ignore
import BN from 'bn.js';
import { supportedCoins } from "./constants";

let cetusSDK: CetusClmmSDK;

const initSDK = () => {
  if (!cetusSDK) {
    cetusSDK = initCetusSDK({
      network: 'mainnet',
      fullNodeUrl: 'https://fullnode.mainnet.sui.io',
      simulationAccount: '',
    });
  }
  return cetusSDK;
};

export const cetusTool = tool({
  description: "Interact with Cetus DEX protocol for swaps, liquidity provision, and pool information. For coinTypeA and coinTypeB, use one of these supported addresses: " + supportedCoins.join(", ") + ". If someone asks for a swap make sure they want to use cetus and not another dex, make sure that when someone asks to perform a certain action that you ask for the correct paramaters",
  parameters: z.object({
    action: z.enum([
      "getPool",
      "getPositions", 
      "addLiquidity",
      "removeLiquidity",
      "swap",
      "createPool"
    ]).describe("Action to perform on Cetus"),
    poolId: z.string().optional().describe("Pool ID for the operation"),
    positionId: z.string().optional().describe("Position ID for removing liquidity"),
    amount: z.string().optional().describe("Amount for swap or liquidity operation"),
    slippage: z.number().optional().describe("Slippage tolerance (e.g. 0.01 for 1%)"),
    address: z.string().optional().describe("Address to query positions for"),
    coinTypeA: z.string().optional().describe("First coin type for pool creation"),
    coinTypeB: z.string().optional().describe("Second coin type for pool creation"),
    tickSpacing: z.number().optional().describe("Tick spacing for pool creation"),
    initialPrice: z.string().optional().describe("Initial price for pool creation"),
  }),
  execute: async (args) => {
    const sdk = initSDK();
    const keypair = await instantiateAccount(process.env.SUI_PRIVATE_KEY);

    switch (args.action) {
      case "getPool": {
        if (!args.poolId) throw new Error("Pool ID required");
        const pool = await sdk.Pool.getPool(args.poolId);
        return { pool };
      }

      case "getPositions": {
        if (!args.address) throw new Error("Address required");
        const positions = await sdk.Position.getPositionList(
          args.address,
          args.poolId ? [args.poolId] : undefined
        );
        return { positions };
      }

      case "addLiquidity": {
        if (!args.poolId || !args.amount || !args.slippage) {
          throw new Error("Pool ID, amount and slippage required");
        }

        const pool = await sdk.Pool.getPool(args.poolId);
        const currentTick = TickMath.sqrtPriceX64ToTickIndex(
          new BN(pool.current_sqrt_price)
        );
        const tickSpacing = Number(pool.tickSpacing);
        
        const tickLower = TickMath.getPrevInitializableTickIndex(
          currentTick,
          tickSpacing
        );
        const tickUpper = TickMath.getNextInitializableTickIndex(
          currentTick,
          tickSpacing
        );

        const liquidityInput = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
          tickLower,
          tickUpper,
          new BN(args.amount),
          true,
          true,
          args.slippage,
          new BN(pool.current_sqrt_price)
        );

        const payload = await sdk.Position.createAddLiquidityFixTokenPayload({
          coinTypeA: pool.coinTypeA,
          coinTypeB: pool.coinTypeB,
          pool_id: args.poolId,
          amount_a: liquidityInput.tokenMaxA.toString(),
          amount_b: liquidityInput.tokenMaxB.toString(),
          tick_lower: tickLower.toString(),
          tick_upper: tickUpper.toString(),
          is_open: true,
          slippage: args.slippage,
          fix_amount_a: true,
          rewarder_coin_types: [],
          collect_fee: false,
          pos_id: '',
        });

        const result = await suiClient.signAndExecuteTransaction({
          transaction: payload,
          signer: keypair,
          options: { showEffects: true }
        });

        return { success: true, digest: result.digest };
      }

      case "swap": {
        if (!args.poolId || !args.amount || !args.slippage) {
          throw new Error("Pool ID, amount and slippage required");
        }

        const pool = await sdk.Pool.getPool(args.poolId);
        const preSwap = await sdk.Swap.preswap({
          pool,
          currentSqrtPrice: pool.current_sqrt_price,
          coinTypeA: pool.coinTypeA,
          coinTypeB: pool.coinTypeB,
          decimalsA: 9,
          decimalsB: 9,
          a2b: true,
          byAmountIn: true,
          amount: args.amount,
        });

        const toAmount = preSwap?.byAmountIn
          ? preSwap.estimatedAmountOut
          : preSwap?.estimatedAmountIn;
        const amountLimit = adjustForSlippage(
          toAmount,
          new Percentage(new BN(args.slippage * 100), new BN(100)),
          !preSwap?.byAmountIn
        );

        const payload = await sdk.Swap.createSwapTransactionPayload({
          pool_id: args.poolId,
          coinTypeA: pool.coinTypeA,
          coinTypeB: pool.coinTypeB,
          a2b: true,
          by_amount_in: true,
          amount: args.amount,
          amount_limit: amountLimit.toString(),
        });

        const result = await suiClient.signAndExecuteTransaction({
          transaction: payload,
          signer: keypair,
          options: { showEffects: true }
        });

        return { success: true, digest: result.digest };
      }

      case "removeLiquidity": {
        if (!args.positionId || !args.amount || !args.slippage) {
          throw new Error("Position ID, amount and slippage required");
        }

        const position = await sdk.Position.getPositionById(args.positionId);
        const pool = await sdk.Pool.getPool(position.pool);

        const lowerSqrtPrice = TickMath.tickIndexToSqrtPriceX64(
          position.tick_lower_index
        );
        const upperSqrtPrice = TickMath.tickIndexToSqrtPriceX64(
          position.tick_upper_index
        );
        const curSqrtPrice = new BN(pool.current_sqrt_price);

        // Get token amounts from liquidity
        const coinAmounts = ClmmPoolUtil.getCoinAmountFromLiquidity(
          new BN(args.amount),
          curSqrtPrice,
          lowerSqrtPrice,
          upperSqrtPrice,
          false
        );

        // Adjust for slippage
        const slippageTolerance = new Percentage(
          new BN(args.slippage * 100),
          new BN(100)
        );
        const minAmountA = adjustForSlippage(
          coinAmounts.coinA,
          slippageTolerance,
          false
        );
        const minAmountB = adjustForSlippage(
          coinAmounts.coinB,
          slippageTolerance,
          false
        );

        const payload = await sdk.Position.removeLiquidityTransactionPayload({
          coinTypeA: pool.coinTypeA,
          coinTypeB: pool.coinTypeB,
          delta_liquidity: args.amount,
          min_amount_a: minAmountA.toString(),
          min_amount_b: minAmountB.toString(),
          pool_id: pool.poolAddress,
          pos_id: args.positionId,
          collect_fee: true,
          rewarder_coin_types: [],
        });

        const result = await suiClient.signAndExecuteTransaction({
          transaction: payload,
          signer: keypair,
          options: { showEffects: true }
        });

        return { success: true, digest: result.digest };
      }

      case "createPool": {
        if (!args.coinTypeA || !args.coinTypeB || !args.tickSpacing || !args.initialPrice) {
          throw new Error("Coin types, tick spacing and initial price required for pool creation");
        }

        const initSqrtPrice = TickMath.priceToSqrtPriceX64(
          d(args.initialPrice),
          6,
          6
        ).toString();

        const payload = await sdk.Pool.createPoolTransactionPayload({
          coinTypeA: args.coinTypeA,
          coinTypeB: args.coinTypeB,
          tick_spacing: args.tickSpacing,
          initialize_sqrt_price: initSqrtPrice,
          uri: '',
          amount_a: '0',
          amount_b: '0',
          fix_amount_a: true,
          tick_lower: 0,
          tick_upper: 0,
          metadata_a: '',
          metadata_b: '',
          slippage: 0,
        });

        const result = await suiClient.signAndExecuteTransaction({
          transaction: payload,
          signer: keypair,
          options: { showEffects: true }
        });

        return { 
          success: true, 
          digest: result.digest,
          poolId: result.effects?.created?.[0]?.reference?.objectId
        };
      }

      default:
        throw new Error("Invalid action specified");
    }
  },
});
