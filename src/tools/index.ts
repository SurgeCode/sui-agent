import { CoreTool } from "ai";
import { getAllBalancesTool } from "./getAllBalances";
import { getPricesTool } from "./getPrices";
import { liquidStakingTool } from "./liquidStaking";
import { listCoinsTool } from "./listCoins";
import { naviTool } from "./navi";
import { queryBlockchainTool } from "./queryBlockchain";
import { sendSuiTool } from "./sendSui";
import { swapTool } from "./swapTool";

export const tools = {
  registry: {
    navi: naviTool,
    sendSui: sendSuiTool,
    liquidStaking: liquidStakingTool,
    queryBlockchain: queryBlockchainTool,
    listCoins: listCoinsTool,
    swap: swapTool,
    getAllBalances: getAllBalancesTool,
    getPrices: getPricesTool,
  } as Record<string, CoreTool>,
  
  navi: naviTool,
  sendSui: sendSuiTool,
  liquidStaking: liquidStakingTool,
  queryBlockchain: queryBlockchainTool,
  listCoins: listCoinsTool,
  swap: swapTool,
  getAllBalances: getAllBalancesTool,
  getPrices: getPricesTool,
};

export type ToolsRegistry = typeof tools.registry;

export function getToolKeys(): string[] {
  return Object.keys(tools.registry);
}

export function getTools(selectedTools?: string[]): Record<string, CoreTool> {
  if (selectedTools) {
    return Object.fromEntries(
      selectedTools
        .filter(key => key in tools.registry)
        .map(key => [key, tools.registry[key]])
    );
  }

  return tools.registry;
}

export type ToolMetadata = {
  name: string;
  description: string;
};

// Re-export individual tools for direct imports
export {
  getAllBalancesTool,
  getPricesTool,
  liquidStakingTool,
  listCoinsTool,
  naviTool,
  queryBlockchainTool,
  sendSuiTool,
  swapTool,
};