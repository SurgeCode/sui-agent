import { tool } from "ai";
import { z } from "zod";
import { instantiateAccount } from "../sui";
import { NAVISDKClient } from "navi-sdk";

export const naviTool = tool({
  description: "Interact with NAVI protocol to supply tokens, withdraw tokens, borrow, repay or claim rewards",
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
}); 