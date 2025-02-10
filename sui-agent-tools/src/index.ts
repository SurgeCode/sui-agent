import { CoreTool } from "ai";
import { getAllBalancesTool } from "./getAllBalances";
import { getPricesTool } from "./getPrices";
import { liquidStakingTool } from "./liquidStaking";
import { listCoinsTool } from "./listCoins";
import { naviTool } from "./navi";
import { queryBlockchainTool } from "./queryBlockchain";
import { sendSuiTool } from "./sendSui";
import { swapTool } from "./swapTool";
import { cetusTool } from "./cetus";
import { bluefinTool } from "./bluefinTool";

const tools = {
  registry: {
    navi: naviTool,
    sendSui: sendSuiTool,
    liquidStaking: liquidStakingTool,
    queryBlockchain: queryBlockchainTool,
    listCoins: listCoinsTool,
    swap: swapTool,
    getAllBalances: getAllBalancesTool,
    getPrices: getPricesTool,
    cetus: cetusTool,
    bluefin: bluefinTool,
  } as Record<string, CoreTool>,
  
  navi: naviTool,
  sendSui: sendSuiTool,
  liquidStaking: liquidStakingTool,
  queryBlockchain: queryBlockchainTool,
  listCoins: listCoinsTool,
  swap: swapTool,
  getAllBalances: getAllBalancesTool,
  getPrices: getPricesTool,
  cetus: cetusTool,
  bluefin: bluefinTool,
};

type ToolsRegistry = typeof tools.registry;

function getToolKeys(): string[] {
  return Object.keys(tools.registry);
}

function getTools(selectedTools?: string[]): Record<string, CoreTool> {
  if (selectedTools) {
    return Object.fromEntries(
      selectedTools
        .filter(key => key in tools.registry)
        .map(key => [key, tools.registry[key]])
    );
  }

  return tools.registry;
}

type ToolMetadata = {
  name: string;
  description: string;
};

export {
  tools,
  ToolsRegistry,
  getToolKeys,
  getTools,
  ToolMetadata,
  getAllBalancesTool,
  getPricesTool,
  liquidStakingTool,
  listCoinsTool,
  naviTool,
  queryBlockchainTool,
  sendSuiTool,
  swapTool,
  cetusTool,
  bluefinTool,
};