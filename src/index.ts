import { Command } from 'commander';
import { streamText, type CoreMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import { instantiateAccount, suiClient, balance, validateEnv, setupAccount } from './sui';
import { getTools, getToolKeys } from './tools';
import enquirer from 'enquirer';

dotenv.config();

function getSystemPrompt(address: string, currentBalance: any, autonomousMode: boolean = false) {
  return `I'm ZOE a Sui blockchain assistant${autonomousMode ? ` running in autonomous mode` : ''}.
          My responses should be organic, friendly and focused on providing clear transaction outcomes.
          When executing transactions, I will always provide the transaction digest and offer to look up additional details if the query tool is available.
          ${address ? `Current address: ${address}` : ''}
          ${currentBalance ? `Current balance: ${balance(currentBalance)} SUI` : ''}
          
          ${!autonomousMode ? `I can help you with the tools you've selected. Just let me know what you'd like to do and I'll help guide you through using them.` : ''}`;
}

async function handleLLMCall(address: string, messages: CoreMessage[], selectedTools: string[], prompt?: string) {
  const currentBalance = await suiClient.getBalance({
    owner: address
  });

  if (prompt) {
    messages.push({ role: 'user', content: prompt });
  }

  const { textStream } = await streamText({
    system: getSystemPrompt(address, currentBalance),
    model: anthropic('claude-3-haiku-20240307'),
    messages,
    maxSteps: 5,
    tools: getTools(selectedTools)
  });

  let assistantResponse = '';
  return { textStream, assistantResponse };
}

async function assistantMode(selectedTools: string[]) {
  validateEnv();
  const address = await setupAccount();
  const messages: CoreMessage[] = [];

  const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  while (true) {
    const userInput = await new Promise<string>((resolve) => {
      terminal.question('You: ', resolve);
    });
    messages.push({ role: 'user', content: userInput });

    let assistantResponse = '';
    const { textStream } = await handleLLMCall(address, messages, selectedTools);
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

async function autonomousMode(interval: number, prompt: string, selectedTools: string[]) {
  validateEnv();
  const address = await setupAccount();
  const messages: CoreMessage[] = [];

  let assistantResponse = '';
  const { textStream } = await handleLLMCall(address, messages, selectedTools, prompt);

  for await (const textPart of textStream) {
    assistantResponse += textPart;
  }
  console.log(`[${new Date().toISOString()}] Assistant: ${assistantResponse}\n`);
  messages.push({ role: 'assistant', content: assistantResponse });

  setInterval(async () => {
    let assistantResponse = '';
    const { textStream } = await handleLLMCall(address, messages, selectedTools, prompt);

    for await (const textPart of textStream) {
      assistantResponse += textPart;
    }
    console.log(`[${new Date().toISOString()}] Assistant: ${assistantResponse}\n`);
    messages.push({ role: 'assistant', content: assistantResponse });
  }, interval * 60 * 1000); 
}

const program = new Command();

program
  .name('sui-assistant')
  .description('Sui blockchain assistant with interactive and autonomous modes')
  .version('0.1.0')
  .action(async () => {
    const modeResponse = await enquirer.prompt<{mode: string}>({
      type: 'select',
      name: 'mode',
      message: 'Select operation mode',
      choices: ['Assistant Mode', 'Autonomous Mode']
    });

    const toolsResponse = await enquirer.prompt<{tools: string[]}>({
      type: 'multiselect',
      name: 'tools',
      message: 'Select the tools you want to use (spacebar to select)',
      choices: getToolKeys()
    });

    if (modeResponse.mode === 'Assistant Mode') {
      await assistantMode(toolsResponse.tools);
    } else {
      const intervalResponse = await enquirer.prompt<{interval: string}>({
        type: 'select',
        name: 'interval',
        message: 'Select interval (in minutes)',
        choices: ['1', '5', '15', '30', '60']
      });

      const interval = parseInt(intervalResponse.interval);

      const promptResponse = await enquirer.prompt<{prompt: string}>({
        type: 'input',
        name: 'prompt',
        message: 'Enter the prompt for autonomous mode'
      });

      await autonomousMode(interval, promptResponse.prompt, toolsResponse.tools);
    }
  });

program.parse();