// c:\Users\yepis\dev\llm-dialog\conversation.ts
import { promises as fs } from 'fs';
import { callLLM1Unified, callLLM2Unified } from './llm';
import { LLM1_MODEL, LLM2_MODEL, systemPromptLLM1, systemPromptLLM2 } from './config';

export async function runConversationUnified(initialMessage: string, turns: number) {
  const originalQuestion = initialMessage;
  let currentMessage = initialMessage;
  let conversationLog = '';

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
