import { callLLMUnified, callLLM1Unified, callLLM2Unified } from '../llm';
import axios from 'axios';
import { initConfig } from '../config';

jest.mock('axios');

// Set test environment flag
process.env.NODE_ENV = 'test';

// Mock config module
jest.mock('../config', () => {
  const testConfig = {
    LLM1_ENDPOINT: 'https://api1.example.com',
    LLM2_ENDPOINT: 'https://api2.example.com',
    LLM1_API_KEY: 'key1',
    LLM2_API_KEY: 'key2',
    LLM1_MODEL: 'model1',
    LLM2_MODEL: 'model2',
    systemPromptLLM1: 'system prompt 1',
    systemPromptLLM2: 'system prompt 2'
  };

  return {
    ...testConfig,
    initConfig: jest.fn(() => testConfig),
    systemPromptLLM1: () => testConfig.systemPromptLLM1,
    systemPromptLLM2: () => testConfig.systemPromptLLM2,
  };
});

describe('LLM Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('callLLMUnified', () => {
    it('should throw error when endpoint is undefined', async () => {
      await expect(callLLMUnified(
        '',
        'api-key',
        'system prompt',
        'original question',
        'message',
        'model-name'
      )).rejects.toThrow('Endpoint URL is required');
    });

    it('should handle Google API calls correctly', async () => {
      const mockResponse = {
        data: {
          candidates: [{
            content: {
              parts: [{ text: 'response text' }]
            }
          }]
        }
      };
      (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await callLLMUnified(
        'https://googleapis.com/v1/models',
        'api-key',
        'system prompt',
        'original question',
        'message',
        'model-name'
      );

      expect(result).toBe('response text');
      expect(axios.post).toHaveBeenCalledWith(
        'https://googleapis.com/v1/models/model-name:generateContent?key=api-key',
        expect.objectContaining({
          contents: [{
            parts: expect.arrayContaining([
              { text: expect.stringContaining('system prompt') },
              { text: expect.stringContaining('original question') },
              { text: 'message' }
            ])
          }]
        }),
        expect.any(Object)
      );
    });

    it('should handle OpenAI-style API calls correctly', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: 'response text'
            }
          }]
        }
      };
      (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await callLLMUnified(
        'https://api.example.com',
        'api-key',
        'system prompt',
        'original question',
        'message',
        'model-name'
      );

      expect(result).toBe('response text');
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.example.com/',
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'system', content: expect.any(String) },
            { role: 'user', content: expect.any(String) }
          ])
        }),
        expect.any(Object)
      );
    });

    it('should throw error on unexpected API response format', async () => {
      const mockResponse = {
        data: {
          unexpected: 'format'
        }
      };
      (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(callLLMUnified(
        'https://api.example.com',
        'api-key',
        'system prompt',
        'original question',
        'message',
        'model-name'
      )).rejects.toThrow('Unexpected API response format');
    });
  });

  describe('callLLM1Unified and callLLM2Unified', () => {
    it('should call LLM1 with correct parameters', async () => {
      const mockGoogleResponse = {
        data: {
          candidates: [{
            content: {
              parts: [{ text: 'response text' }]
            }
          }]
        }
      };
      (axios.post as jest.Mock).mockResolvedValueOnce(mockGoogleResponse);

      const result = await callLLM1Unified('original question', 'message');
      expect(result).toBe('response text');
      expect(axios.post).toHaveBeenCalledWith(
        'https://api1.example.com/',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should call LLM2 with correct parameters', async () => {
      const mockOpenAIResponse = {
        data: {
          choices: [{
            message: {
              content: 'response text'
            }
          }]
        }
      };
      (axios.post as jest.Mock).mockResolvedValueOnce(mockOpenAIResponse);

      const result = await callLLM2Unified('original question', 'message');
      expect(result).toBe('response text');
      expect(axios.post).toHaveBeenCalledWith(
        'https://api2.example.com/',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});