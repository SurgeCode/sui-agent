import { streamText, type CoreMessage, tool, type CoreTool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { instantiateAccount, suiClient, balance } from './sui';
import { getTools } from './tools';

dotenv.config();

export const maxDuration = 30;

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const messages: CoreMessage[] = [];

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  if (!process.env.SUI_PRIVATE_KEY) {
    throw new Error('SUI_PRIVATE_KEY environment variable is required');
  }

  const keypair = await instantiateAccount(process.env.SUI_PRIVATE_KEY);
  const address = keypair.getPublicKey().toSuiAddress();

  while (true) {
    const currentBalance = await suiClient.getBalance({
      owner: address
    });

    const userInput = await new Promise<string>((resolve) => {
      terminal.question('You: ', resolve);
    });
    messages.push({ role: 'user', content: userInput });

    const { textStream } = await streamText({
      system: `I'm a Sui blockchain assistant. I can help you interact with the Sui network.
              Your current address is: ${address}
              Your current balance is: ${balance(currentBalance)} SUI

              I can help you:
              - Send SUI to other addresses 
              - Query blockchain information using GraphQL
              - View available coins for trading on Aftermath
              - Get quotes and execute trades

              Just let me know what you'd like to do and I'll help guide you through using the available tools. I'll wait for your specific request before executing any actions.`,
      model: anthropic('claude-3-haiku-20240307'),
      messages,
      maxSteps: 5,
      tools: getTools()
    });
    let assistantResponse = '';
    process.stdout.write('\nAssistant: ');
   
    try {
      for await (const textPart of textStream) {
        process.stdout.write(textPart);
        assistantResponse += textPart;
      }
    } catch (error) {
      if (error instanceof RangeError) {
        console.error('Error: Invalid number conversion');
      } else {
        throw error;
      }
    }
    console.log('\n');
    messages.push({ role: 'assistant', content: assistantResponse });
  }
}

main().catch(console.error);