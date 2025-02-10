# 🤖 Zoe & Sui Agent Tools: 
## Agent Tech To Power the Sui Ecosystem

![Zoe Demo](https://i.imgur.com/xlodADb.gif)

## Zoe 
Zoe is a minimalistic AI agent framework that's simple and easy to run, optimized for onboarding people into agent tech, it offers both assistant and autonomous modes, can be consumed via CLI, telegram bot, or Web CHAT. It uses both vercel AI SDK and atoma network to execute LLM calls. It can be extended with new tools and ecosystem integrations having already direct access to most of the sui ecosystem via the sui-agent-tools package.

### 🌟 Key Features

- **💬 Assistant Mode**: Chat naturally with Zoe to execute DeFi operations
  ```bash
  You: "Swap 10 SUI for USDC"
  Zoe: "I'll help you swap 10 SUI for USDC using the best available rate..."
  ```
- **🤖 Autonomous Mode**: Set up automated trading and monitoring
  ```bash
  You: "Monitor USDC/SUI price and swap when it hits 10"
  Zoe: "I'll watch the USDC/SUI pair and execute the swap when target is reached..."
  ```




## Sui Agent Tools Overview
Sui Agent Tools provides a comprehensive suite of blockchain tools with unmatched ecosystem coverage - from DEX integrations to lending protocols. The entire Sui agent ecosystem can leverage these tools since they are built to be fully compatible with atoma-agents, sui-agent-kit, eliza, Open AI, and vercel AI SDK. This means any agent in the ecosystem can tap into it. While these powerful tools come pre-integrated into Zoe's natural language interface, they can be easily plugged into any agent.


| Tool | Description | Key Functions |
|------|-------------|---------------|
| **Swap Tool (Aftermath)** | DEX trading interface | Get quotes, execute swaps, slippage protection, token support |
| **NAVI Protocol** | Lending/borrowing operations | Supply, withdraw, borrow, repay, claim rewards |
| **Liquid Staking (Spring)** | Spring protocol integration | Mint/redeem sSUI, manage staking positions |
| **Cetus DEX** | Full DEX functionality | Pool, liquidity, swap and position management |
| **Bluefin DEX** | Spot trading interface | Execute trades with slippage protection, pool management |
| **Balance Tools** | Account management | Get balances, transfer SUI tokens |
| **Price Tools** | Market data access | Current prices, changes, market data |
| **Query Tool** | Blockchain data access | Chain info, address and transaction data |
| **List Coins** | Token reference | Supported tokens, pairs, addresses |


### 🧠 Multi-LLM Support
- Claude
- GPT-4
- Llama (via Atoma Network)
- DeepSeek (via Atoma Network)

## 🚀 Quick Start

### ZOE: 
# Environment Variables Required:

Create a .env file with the following variables:
```
ANTHROPIC_API_KEY=
SUI_PRIVATE_KEY=
ATOMA_API_KEY=
OPENAI_API_KEY=
```

Run Zoe
```
pnpm i && pnpm dev
```

### sui-agent-tools

````
pnpm i sui-agent-tools
````

Check tool list above
```typescript
import { generateText } from 'ai';
import { swapTool } from './swapTool';
import { listCoinsTool } from './listCoinsTool'; 

async function runSuiAgent() {
  try {
    const result = await generateText({
      model: openai('gpt-4'),
      system: SYSTEM_PROMPT,
      tools: {
        swap: swapTool,
        listCoins: listCoinsTool
      },
      maxSteps: 3
    });

  }}
```


## 🤝 Ecosystem Integration

### Atoma Network
- Executions for zoe for LLAMA and DeepSeek models
- All tools can be ingested into the atoma-agents framework to provide ecosystem coverage and also can ingest atoma-agent tools (once available exported)

### Sui Blockchain
- Direct integration with transaction building using Sui typescript SDK
- Connection to SUI rpc and graphql interafaces for data

### NAVI Protocol
- Lending, borrowing, supplying, withdrawing, claiming rewards and more as a tool that can be used by any agent in and outside of the sui ecosystem
- Use cases with Zoe assistant mode: "Supply 100 SUI to NAVI and borrow USDC", or autonomous mode: "Auto claim every minute and supply to compound"

### SuiLend/SpringSui
- Minting and redeeming sSUI as a tool that can be used by any agent in and outside of the sui ecosystem
- Use cases with Zoe assistant mode: "Mint 100 sSUI", or autonomous mode: "Auto redeem sSUI when price is below target"

### Cetus DEX & Aftermath Dex integration
- Full DEX functionality as a tool that can be used by any agent in and outside of the sui ecosystem
- Use cases with Zoe assistant mode: "Swap 100 SUI for USDC", or autonomous mode: "Auto swap to snipe at price target, dca into this every minute"


## 📚 Documentation

For detailed documentation on available tools and commands, visit our [Documentation](docs/README.md).

## 🔮 Roadmap & Next Steps

### Bitte Protocol Integration
- Full integration with Bitte multiagent protocol
- Enable cross-agent communication and coordination
- Leverage Bitte's mature agent infrastructure

### Tool Enhancements
- Improve individual tools
- Add more tools to the suite, contact me if you want your dapp integrated

### Usage Examples
- Telegram bot integration guide
- Web chat implementation
- Discord bot setup
- API documentation
- Custom UI templates

### Ecosystem Collaboration
- Joint GTM initiatives with partners
