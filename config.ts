// c:\Users\yepis\dev\llm-dialog\config.ts
import { promises as fs } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export const LLM1_ENDPOINT = process.env.LLM1_ENDPOINT!;
export const LLM2_ENDPOINT = process.env.LLM2_ENDPOINT!;
export const LLM1_API_KEY = process.env.LLM1_API_KEY!;
export const LLM2_API_KEY = process.env.LLM2_API_KEY!;
export const LLM1_MODEL = process.env.LLM1_MODEL!;
export const LLM2_MODEL = process.env.LLM2_MODEL!;

export let systemPromptLLM1: string;
export let systemPromptLLM2: string;

export async function loadSystemPrompts() {
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
