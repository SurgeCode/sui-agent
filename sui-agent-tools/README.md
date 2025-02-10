# Sui Agent Tools

A collection of tools for interacting with various protocols on the Sui blockchain.


These tools are designed to be used with AI tools seemlessly and are interchangebly used with vercel AI SDK, atoma network, openai, anthropic, bitte.ai, sui-agent-kit


## Installation


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


```typescript
import { generateText } from 'ai';
import { swapTool } from './swapTool';
import { listCoinsTool } from './listCoinsTool'; // Assuming you have this tool
import { z } from 'zod';

async function runSuiAgent() {
  try {
    const result = await generateText({
      model: openai('gpt-4'),
      system: `You are a helpful assistant that helps users trade tokens on the Sui blockchain using Aftermath DEX.
        Always follow these steps:
        1. When a user wants to swap, first get a quote using getQuote
        2. Show the quote details to the user and ask for confirmation
        3. Only execute the swap after user confirmation with executeSwap
        4. Always use proper decimal conversion for token amounts`,
      prompt: "I want to swap 0.1 SUI for USDC",
      tools: {
        swap: swapTool,
        listCoins: listCoinsTool
      },
      // Enable multiple steps to allow quote -> confirm -> execute flow
      maxSteps: 3
    });

  }}
```
Getting all tools
````typescript

import { generateText } from 'ai';
import { getTools, tools } from '../src/index';

// Example 1: Basic tool selection
const allTools = getTools();
console.log('Available tools:', Object.keys(allTools));

async function swapTokensExample() {
    
    try {
        const result = await generateText({
            model: openai('gpt-4'),
            system: `I'm a Sui blockchain assistant.
                My responses should be organic, friendly and focused on providing clear transaction outcomes.
                When executing transactions, I will always provide the transaction digest and offer to look up additional details if the query tool is available.
                I can help you with the tools you've selected. Just let me know what you'd like to do and I'll help guide you through using them.`,
            prompt: "I want to swap 0.1 SUI for USDC",
            tools: getTools();
            maxSteps: 3
        });
        
        console.log('AI Response:', result);
    } catch (error) {
        console.error('Error during swap:', error);
    }
}

```

