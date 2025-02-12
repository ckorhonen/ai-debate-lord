// c:\Users\yepis\dev\llm-dialog\config.ts
import { promises as fs } from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

function getEnv(variable: string, defaultValue?: string): string {
  const value = process.env[variable] || defaultValue;
  if (!value) {
    console.error(`Missing required environment variable: ${variable}`);
    process.exit(1);
  }
  return value;
}

export const LLM1_ENDPOINT = getEnv('LLM1_ENDPOINT');
export const LLM2_ENDPOINT = getEnv('LLM2_ENDPOINT', 'http://localhost:11434/v1/chat/completions');
export const LLM1_API_KEY = getEnv('LLM1_API_KEY');
export const LLM2_API_KEY = getEnv('LLM2_API_KEY', '');
export const LLM1_MODEL = getEnv('LLM1_MODEL');
export const LLM2_MODEL = getEnv('LLM2_MODEL', 'ollama-default-model');

export let systemPromptLLM1: string;
export let systemPromptLLM2: string;

export async function loadSystemPrompts() {
  try {
    systemPromptLLM1 = await fs.readFile(path.join(__dirname, '../system_prompt_llm1.txt'), 'utf-8');
  } catch (error) {
    console.error(`Error reading system_prompt_llm1.txt at ${path.join(__dirname, '../system_prompt_llm1.txt')}, using default prompt:`, error);
    systemPromptLLM1 = 'You are the enabler. Always angles to find the constructive way forwards.';
  }
  try {
    systemPromptLLM2 = await fs.readFile(path.join(__dirname, '../system_prompt_llm2.txt'), 'utf-8');
  } catch (error) {
    console.error(`Error reading system_prompt_llm2.txt at ${path.join(__dirname, '../system_prompt_llm2.txt')}, using default prompt:`, error);
    systemPromptLLM2 = 'You are the critic. Always finds the flaw, but not for the sake of negativity. The goal is to be the critical mind essential to reaching a quality verdict.';
  }
}
