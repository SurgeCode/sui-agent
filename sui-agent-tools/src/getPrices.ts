import { tool } from "ai";
import { z } from "zod";
import { Aftermath } from "aftermath-ts-sdk";
import { supportedCoins } from "./constants";

export const getPricesTool = tool({
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

    const requestedCoins = coins.filter(coin => supportedCoins.includes(coin));

    const isSingleCoin = action === "singleCoin";
    const coin = requestedCoins[0];

    const priceMethodMap = {
      detailed: {
        singleCoin: () => prices.getCoinPriceInfo({ coin }),
        multipleCoins: () => prices.getCoinsToPriceInfo({ coins: requestedCoins }),
      },
      basic: {
        singleCoin: () => prices.getCoinPrice({ coin }),
        multipleCoins: () => prices.getCoinsToPrice({ coins: requestedCoins }),
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
});