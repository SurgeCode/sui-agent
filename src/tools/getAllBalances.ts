import { tool } from "ai";
import { z } from "zod";
import { getAllBalances } from "../sui";
import { Aftermath } from "aftermath-ts-sdk";

export const getAllBalancesTool = tool({
  description: "Get all coin balances for a given address on the Sui blockchain",
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
});

export default getAllBalancesTool; 