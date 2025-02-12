import { getEnv, loadSystemPrompts, ConfigError, initConfig, resetConfig } from '../config';
import { promises as fs } from 'fs';
import path from 'path';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  }
}));

describe('Config Module', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.NODE_ENV = 'test';
    resetConfig();
    jest.clearAllMocks();
  });

  afterEach(() => {
    resetConfig();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('initConfig', () => {
    it('should initialize config with environment variables', () => {
      const overrides = {
        LLM1_ENDPOINT: 'test-endpoint-1',
        LLM2_ENDPOINT: 'test-endpoint-2',
        LLM1_API_KEY: 'test-key-1',
        LLM2_API_KEY: 'test-key-2',
        LLM1_MODEL: 'test-model-1',
        LLM2_MODEL: 'test-model-2'
      };

      const config = initConfig(overrides);

      expect(config.LLM1_ENDPOINT).toBe('test-endpoint-1');
      expect(config.LLM2_ENDPOINT).toBe('test-endpoint-2');
      expect(config.LLM1_API_KEY).toBe('test-key-1');
      expect(config.LLM2_API_KEY).toBe('test-key-2');
      expect(config.LLM1_MODEL).toBe('test-model-1');
      expect(config.LLM2_MODEL).toBe('test-model-2');
    });

    it('should use default values when optional variables are missing', () => {
      const overrides = {
        LLM1_ENDPOINT: 'test-endpoint-1',
        LLM1_API_KEY: 'test-key-1',
        LLM1_MODEL: 'test-model-1'
      };

      const config = initConfig(overrides);

      expect(config.LLM2_ENDPOINT).toBe('http://localhost:11434/v1/chat/completions');
      expect(config.LLM2_API_KEY).toBe('');
      expect(config.LLM2_MODEL).toBe('ollama-default-model');
    });
  });

  describe('getEnv', () => {
    it('should return environment variable when it exists', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getEnv('TEST_VAR')).toBe('test-value');
    });

    it('should return default value when env var is missing and default is provided', () => {
      expect(getEnv('MISSING_VAR', 'default-value')).toBe('default-value');
    });

    it('should throw ConfigError when required env var is missing and no default provided', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => getEnv('MISSING_VAR')).toThrow(ConfigError);
      expect(() => getEnv('MISSING_VAR')).toThrow('Missing required environment variable: MISSING_VAR');
      
      expect(consoleSpy).toHaveBeenCalledWith('Missing required environment variable: MISSING_VAR');
      consoleSpy.mockRestore();
    });
  });

  describe('loadSystemPrompts', () => {
    beforeEach(() => {
      // Initialize config with test values before loading prompts
      initConfig({
        LLM1_ENDPOINT: 'test-endpoint-1',
        LLM2_ENDPOINT: 'test-endpoint-2',
        LLM1_API_KEY: 'test-key-1',
        LLM2_API_KEY: 'test-key-2',
        LLM1_MODEL: 'test-model-1',
        LLM2_MODEL: 'test-model-2'
      });
    });

    it('should load system prompts from files', async () => {
      const mockLLM1Prompt = 'System prompt 1';
      const mockLLM2Prompt = 'System prompt 2';

      (fs.readFile as jest.Mock)
        .mockResolvedValueOnce(mockLLM1Prompt)
        .mockResolvedValueOnce(mockLLM2Prompt);

      await loadSystemPrompts();

      expect(fs.readFile).toHaveBeenCalledTimes(2);
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringMatching(/system_prompt_llm1\.txt$/),
        'utf-8'
      );
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringMatching(/system_prompt_llm2\.txt$/),
        'utf-8'
      );
    });

    it('should use default prompts when files cannot be read', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await loadSystemPrompts();

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(fs.readFile).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });
  });
});