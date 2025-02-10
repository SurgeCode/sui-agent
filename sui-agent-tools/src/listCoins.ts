import { tool } from "ai";
import { z } from "zod";
import { supportedCoins } from "./constants";

export const listCoinsTool = tool({
  description:
    "Get a list of all supported coins that can be traded through Aftermath DEX",
  parameters: z.object({}),
  execute: async () => {
    return { supportedCoins };
  },
}); 