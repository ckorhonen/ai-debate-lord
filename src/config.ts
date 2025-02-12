import { promises as fs } from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables immediately
dotenv.config();

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export interface Config {
  LLM1_ENDPOINT: string;
  LLM2_ENDPOINT: string;
  LLM1_API_KEY: string;
  LLM2_API_KEY: string;
  LLM1_MODEL: string;
  LLM2_MODEL: string;
  systemPromptLLM1: string;
  systemPromptLLM2: string;
}

let config: Config | null = null;

export function getEnv(variable: string, defaultValue?: string): string {
  const value = process.env[variable] || defaultValue;
  if (!value) {
    console.error(`Missing required environment variable: ${variable}`);
    if (process.env.NODE_ENV === 'test') {
      throw new ConfigError(`Missing required environment variable: ${variable}`);
    }
    process.exit(1);
  }
  return value;
}

// Initialize configuration
export function initConfig(overrides?: Partial<Config>): Config {
  if (!config) {
    config = {
      LLM1_ENDPOINT: overrides?.LLM1_ENDPOINT ?? getEnv('LLM1_ENDPOINT'),
      LLM2_ENDPOINT: overrides?.LLM2_ENDPOINT ?? getEnv('LLM2_ENDPOINT', 'http://localhost:11434/v1/chat/completions'),
      LLM1_API_KEY: overrides?.LLM1_API_KEY ?? getEnv('LLM1_API_KEY'),
      LLM2_API_KEY: overrides?.LLM2_API_KEY ?? getEnv('LLM2_API_KEY', ''),
      LLM1_MODEL: overrides?.LLM1_MODEL ?? getEnv('LLM1_MODEL'),
      LLM2_MODEL: overrides?.LLM2_MODEL ?? getEnv('LLM2_MODEL', 'ollama-default-model'),
      systemPromptLLM1: overrides?.systemPromptLLM1 ?? '',
      systemPromptLLM2: overrides?.systemPromptLLM2 ?? ''
    };
  }
  return config;
}

export async function loadSystemPrompts() {
  const cfg = initConfig();
  try {
    cfg.systemPromptLLM1 = await fs.readFile(path.join(__dirname, '../system_prompt_llm1.txt'), 'utf-8');
  } catch (error) {
    console.error('Error reading system_prompt_llm1.txt, using default prompt:', error);
    cfg.systemPromptLLM1 = 'You are the enabler. Always angles to find the constructive way forwards.';
  }
  try {
    cfg.systemPromptLLM2 = await fs.readFile(path.join(__dirname, '../system_prompt_llm2.txt'), 'utf-8');
  } catch (error) {
    console.error('Error reading system_prompt_llm2.txt, using default prompt:', error);
    cfg.systemPromptLLM2 = 'You are the critic. Always finds the flaw, but not for the sake of negativity. The goal is to be the critical mind essential to reaching a quality verdict.';
  }
}

// Reset config (mainly for testing)
export function resetConfig() {
  config = null;
}

// Initialize config with default values and export
let defaultConfig: Config;
try {
  defaultConfig = initConfig();
} catch (error) {
  if (process.env.NODE_ENV !== 'test') {
    throw error;
  }
  defaultConfig = {
    LLM1_ENDPOINT: '',
    LLM2_ENDPOINT: '',
    LLM1_API_KEY: '',
    LLM2_API_KEY: '',
    LLM1_MODEL: '',
    LLM2_MODEL: '',
    systemPromptLLM1: '',
    systemPromptLLM2: ''
  };
}

export const {
  LLM1_ENDPOINT,
  LLM2_ENDPOINT,
  LLM1_API_KEY,
  LLM2_API_KEY,
  LLM1_MODEL,
  LLM2_MODEL
} = defaultConfig;

export const systemPromptLLM1 = () => config?.systemPromptLLM1 ?? '';
export const systemPromptLLM2 = () => config?.systemPromptLLM2 ?? '';
