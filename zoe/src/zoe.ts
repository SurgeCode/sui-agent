import { Command } from "commander";
import { generateText, streamText, type CoreMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import * as readline from "readline";
import * as dotenv from "dotenv";
import {
  suiClient,
  balance,
  validateEnv,
  setupAccount,
} from "../../sui-agent-tools/src/sui-utils";
import enquirer from "enquirer";
import OpenAI from "openai";
import { getTools, getToolKeys } from "../../sui-agent-tools/src";

dotenv.config();

type LLMProvider = "Claude" | "OpenAI" | "LLAMA" | "DeepSeekR1";

function getSystemPrompt(
  address: string,
  currentBalance: any,
  autonomousMode: boolean = false
) {
  return `I'm ZOE a Sui blockchain assistant${
    autonomousMode ? ` running in autonomous mode` : ""
  }.
          My responses should be organic, friendly and focused on providing clear transaction outcomes.
          When executing transactions, I will always provide the transaction digest and offer to look up additional details if the query tool is available.
          ${address ? `Current address: ${address}` : ""}
          ${
            currentBalance
              ? `Current balance: ${balance(currentBalance)} SUI`
              : ""
          }
          
          ${
            !autonomousMode
              ? `I can help you with the tools you've selected. Just let me know what you'd like to do and I'll help guide you through using them.`
              : ""
          }`;
}

async function handleLLMCall(
  address: string,
  messages: CoreMessage[],
  selectedTools: string[],
  llmProvider: LLMProvider,
  prompt?: string
) {
  const currentBalance = await suiClient.getBalance({
    owner: address,
  });

  if (prompt) {
    messages.push({ role: "user", content: prompt });
  }
  const systemPrompt = getSystemPrompt(address, currentBalance);

  if (llmProvider === "LLAMA" || llmProvider === "DeepSeekR1") {
    return handleAtomaCompletion(
      systemPrompt,
      messages,
      selectedTools,
      llmProvider
    );
  }

  let model;
  switch (llmProvider) {
    case "Claude":
      model = anthropic("claude-3-haiku-20240307");
      break;
    case "OpenAI":
      model = anthropic("gpt-4o-mini");
      break;
    default:
      throw new Error(`Unsupported LLM provider: ${llmProvider}`);
  }

  return await streamText({
    system: systemPrompt,
    model,
    messages,
    maxSteps: 5,
    tools: getTools(selectedTools),
  });
}

async function assistantMode(
  selectedTools: string[],
  llmProvider: LLMProvider
) {
  validateEnv();
  const address = await setupAccount();
  const messages: CoreMessage[] = [];

  const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const userInput = await new Promise<string>((resolve) => {
      terminal.question("You: ", resolve);
    });
    messages.push({ role: "user", content: userInput });

    let assistantResponse = "";
    const { textStream } = await handleLLMCall(
      address,
      messages,
      selectedTools,
      llmProvider
    );
    process.stdout.write("\nAssistant: ");

    try {
      for await (const textPart of textStream) {
        process.stdout.write(textPart);
        assistantResponse += textPart;
      }
    } catch (error) {
      if (error instanceof RangeError) {
        console.error("Error: Invalid number conversion");
      } else {
        throw error;
      }
    }
    console.log("\n");
    messages.push({ role: "assistant", content: assistantResponse });
  }
}

async function autonomousMode(
  interval: number,
  prompt: string,
  selectedTools: string[],
  llmProvider: LLMProvider
) {
  validateEnv();
  const address = await setupAccount();
  const messages: CoreMessage[] = [];

  async function runIteration() {
    let assistantResponse = "";
    const { textStream } = await handleLLMCall(
      address,
      messages,
      selectedTools,
      llmProvider,
      prompt
    );

    for await (const textPart of textStream) {
      assistantResponse += textPart;
    }
    console.log(
      `[${new Date().toISOString()}] Assistant: ${assistantResponse}\n`
    );
    messages.push({ role: "assistant", content: assistantResponse });
  }

  await runIteration();
  setInterval(runIteration, interval * 60 * 1000);
}

async function handleAtomaCompletion(
  systemPrompt: string,
  messages: CoreMessage[],
  selectedTools: string[],
  llmProvider: LLMProvider
) {
  const openai = new OpenAI({
    baseURL: "https://api.atoma.network/v1",
    apiKey: process.env.ATOMA_API_KEY,
  });

  try {
    const model =
      llmProvider === "LLAMA"
        ? "meta-llama/Llama-3.3-70B-Instruct"
        : "deepseek-ai/DeepSeek-R1";

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((msg) => ({
          role: msg.role === "tool" ? "assistant" : msg.role,
          content: msg.content as string,
          tools: getTools(selectedTools),
        })),
      ],
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error(`No response content received from ${llmProvider}`);
    }

    return { textStream: [completion.choices[0].message.content] };
  } catch (error) {
    console.error(`Error calling ${llmProvider}:`, error);
    throw new Error(
      `Failed to get response from ${llmProvider}. Please try again or use a different model.`
    );
  }
}

const program = new Command();

program
  .name("sui-assistant")
  .description("Sui blockchain assistant with interactive and autonomous modes")
  .version("0.1.0")
  .action(async () => {
    const modeResponse = await enquirer.prompt<{ mode: string }>({
      type: "select",
      name: "mode",
      message: "Select operation mode",
      choices: ["Assistant Mode", "Autonomous Mode"],
    });

    const llmResponse = await enquirer.prompt<{ llm: LLMProvider }>({
      type: "select",
      name: "llm",
      message: "Select LLM provider",
      choices: ["Claude", "OpenAI", "LLAMA", "DeepSeekR1"],
    });

    const toolsResponse = await enquirer.prompt<{ tools: string[] }>({
      type: "multiselect",
      name: "tools",
      message: "Select the tools you want to use (spacebar to select)",
      choices: getToolKeys(),
    });

    if (modeResponse.mode === "Assistant Mode") {
      await assistantMode(toolsResponse.tools, llmResponse.llm);
    } else {
      const intervalResponse = await enquirer.prompt<{ interval: string }>({
        type: "select",
        name: "interval",
        message: "Select interval (in minutes)",
        choices: ["1", "5", "15", "30", "60"],
      });

      const interval = parseInt(intervalResponse.interval);

      const promptResponse = await enquirer.prompt<{ prompt: string }>({
        type: "input",
        name: "prompt",
        message: "Enter the prompt for autonomous mode",
      });

      await autonomousMode(
        interval,
        promptResponse.prompt,
        toolsResponse.tools,
        llmResponse.llm
      );
    }
  });

program.parse();
