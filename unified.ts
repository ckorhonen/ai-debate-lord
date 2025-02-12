// unified.ts
import axios from 'axios';
import { promises as fs } from 'fs';
import * as process from 'process';
import dotenv from 'dotenv';

// Load environment variables from a .env file
dotenv.config();

// Retrieve endpoints, API keys, and model names from the environment
const LLM1_ENDPOINT = process.env.LLM1_ENDPOINT!;
const LLM2_ENDPOINT = process.env.LLM2_ENDPOINT!;
const LLM1_API_KEY = process.env.LLM1_API_KEY!;
const LLM2_API_KEY = process.env.LLM2_API_KEY!;
const LLM1_MODEL = process.env.LLM1_MODEL!;
const LLM2_MODEL = process.env.LLM2_MODEL!;

console.log(`Using models: LLM1_MODEL=${LLM1_MODEL}, LLM2_MODEL=${LLM2_MODEL}`);

if (!LLM1_ENDPOINT || !LLM2_ENDPOINT || !LLM1_API_KEY || !LLM2_API_KEY || !LLM1_MODEL || !LLM2_MODEL) {
  console.error('Error: One or more required environment variables are missing.');
  process.exit(1);
}

// Global variables to store system prompts
let systemPromptLLM1: string;
let systemPromptLLM2: string;

// Load system prompts from text files
async function loadSystemPrompts() {
  try {
    systemPromptLLM1 = await fs.readFile('system_prompt_llm1.txt', 'utf-8');
  } catch (error) {
    console.error('Error reading system_prompt_llm1.txt:', error);
    process.exit(1);
  }

  try {
    systemPromptLLM2 = await fs.readFile('system_prompt_llm2.txt', 'utf-8');
  } catch (error) {
    console.error('Error reading system_prompt_llm2.txt:', error);
    process.exit(1);
  }
}

// Build payload for Gemini models
function buildGeminiPayload(systemPrompt: string, originalQuestion: string, message: string) {
  return {
    contents: [{
      parts: [
        { text: `(system prompt: ${systemPrompt.trim()})` },
        { text: `(original question: ${originalQuestion})` },
        { text: message }
      ]
    }]
  };
}

// Build payload for OpenAI/Ollama models
function buildOpenaiPayload(systemPrompt: string, message: string, model: string) {
  return {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt.trim() },
      { role: 'user', content: message }
    ],
    candidate_count: 1
  };
}

// Unified dispatcher function
async function callLLMUnified(
  endpoint: string,
  apiKey: string,
  systemPrompt: string,
  originalQuestion: string,
  message: string,
  model: string
): Promise<string> {
  let url: string;
  let payload: any;

  if (endpoint.toLowerCase().includes('googleapis')) {
    // Gemini mode
    url = `${endpoint}${model}:generateContent?key=${apiKey}`;
    payload = buildGeminiPayload(systemPrompt, originalQuestion, message);
  } else {
    // OpenAI/Ollama mode
    //url = `${endpoint}/v1/chat/completions`;
    url = `${endpoint}`;
    payload = buildOpenaiPayload(systemPrompt, message, model);
  }

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (endpoint.toLowerCase().includes('googleapis')) {
      return response.data.candidates[0].content.parts[0].text.trim();
    } else {
      return response.data.choices[0].message.content.trim();
    }
  } catch (error) {
    console.error(`Error calling LLM at ${url}:`, error);
    throw error;
  }
}

// LLM1 unified call
async function callLLM1Unified(originalQuestion: string, message: string): Promise<string> {
  return callLLMUnified(LLM1_ENDPOINT, LLM1_API_KEY, systemPromptLLM1, originalQuestion, message, LLM1_MODEL);
}

// LLM2 unified call
async function callLLM2Unified(originalQuestion: string, message: string): Promise<string> {
  return callLLMUnified(LLM2_ENDPOINT, LLM2_API_KEY, systemPromptLLM2, originalQuestion, message, LLM2_MODEL);
}

// Unified runConversation function
async function runConversationUnified(initialMessage: string, turns: number) {
  const originalQuestion = initialMessage;
  let currentMessage = initialMessage;
  let conversationLog = '';

  // Log system prompts and original question
  const headerLog = `System Prompt for LLM1 (Model: ${LLM1_MODEL}):\n${systemPromptLLM1}\n\nSystem Prompt for LLM2 (Model: ${LLM2_MODEL}):\n${systemPromptLLM2}\n\nOriginal Question: "${originalQuestion}"\n`;
  console.log(headerLog);
  conversationLog += headerLog;

  for (let i = 0; i < turns; i++) {
    if (i % 2 === 0) {
      conversationLog += `\nTurn ${i + 1} - LLM1 receives a message\n`;
      console.log(`\nTurn ${i + 1} - LLM1 receives a message`);
      try {
        currentMessage = await callLLM1Unified(originalQuestion, currentMessage);
        conversationLog += `LLM1 responds: "${currentMessage}"\n`;
        console.log(`LLM1 responds: "${currentMessage}"`);
      } catch (error) {
        conversationLog += `\nError from LLM1: ${JSON.stringify(error)}\n`;
        console.error('Stopping conversation due to an error from LLM1.');
        break;
      }
    } else {
      conversationLog += `\nTurn ${i + 1} - LLM2 receives a message\n`;
      console.log(`\nTurn ${i + 1} - LLM2 receives a message`);
      try {
        currentMessage = await callLLM2Unified(originalQuestion, currentMessage);
        conversationLog += `LLM2 responds: "${currentMessage}"\n`;
        console.log(`LLM2 responds: "${currentMessage}"`);
      } catch (error) {
        conversationLog += `\nError from LLM2: ${JSON.stringify(error)}\n`;
        console.error('Stopping conversation due to an error from LLM2.');
        break;
      }
    }
  }

  conversationLog += `\nConversation ended after ${turns} turns. Final message: "${currentMessage}"\n`;
  console.log(`\nConversation ended after ${turns} turns. Final message: "${currentMessage}"`);

  // Save the conversation log to a text file
  const logFiles = await fs.readdir('.');
  const logFileNumbers = logFiles
    .filter(file => file.startsWith('conversation_log_'))
    .map(file => parseInt(file.replace('conversation_log_', '').replace('.txt', ''), 10))
    .filter(num => !isNaN(num));
  const nextLogFileNumber = logFileNumbers.length > 0 ? Math.max(...logFileNumbers) + 1 : 1;
  const logFileName = `conversation_log_${nextLogFileNumber}.txt`;
  await fs.writeFile(logFileName, conversationLog);
}

// Main function
async function main() {
  await loadSystemPrompts();

  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: ts-node unified.ts "<initial message>" <number_of_turns> [--file <file_path>]');
    process.exit(1);
  }

  let initialMessage = args[0];
  const turns = parseInt(args[1], 10);

  if (isNaN(turns) || turns <= 0) {
    console.error('The number of turns must be a positive integer.');
    process.exit(1);
  }

  // Check for the --file flag
  const fileFlagIndex = args.indexOf('--file');
  if (fileFlagIndex !== -1 && args[fileFlagIndex + 1]) {
    const filePath = args[fileFlagIndex + 1];
    try {
      initialMessage = await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error(`Error reading file at ${filePath}:`, error);
      process.exit(1);
    }
  }

  await runConversationUnified(initialMessage, turns);
}

// Start the application
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

export {};
