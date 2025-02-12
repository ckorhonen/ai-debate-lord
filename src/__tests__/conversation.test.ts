import { runConversationUnified } from '../conversation';
import * as llm from '../llm';
import { promises as fs } from 'fs';

jest.mock('../llm');
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    writeFile: jest.fn(),
  }
}));

// Mock the config module
jest.mock('../config', () => ({
  LLM1_MODEL: 'test-model-1',
  LLM2_MODEL: 'test-model-2',
  systemPromptLLM1: 'test-prompt-1',
  systemPromptLLM2: 'test-prompt-2'
}));

describe('Conversation Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (llm.callLLM1Unified as jest.Mock).mockImplementation(async (_, message) => `LLM1 response to: ${message}`);
    (llm.callLLM2Unified as jest.Mock).mockImplementation(async (_, message) => `LLM2 response to: ${message}`);
    (fs.readdir as jest.Mock).mockResolvedValue(['conversation_log_1.txt', 'other.txt']);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
  });

  it('should run a conversation for the specified number of turns', async () => {
    const initialMessage = 'test question';
    const turns = 2;

    await runConversationUnified(initialMessage, turns);

    expect(llm.callLLM1Unified).toHaveBeenCalledTimes(1);
    expect(llm.callLLM2Unified).toHaveBeenCalledTimes(1);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.writeFile).toHaveBeenCalledWith(
      'conversation_log_2.txt',
      expect.stringContaining('Original Question: "test question"')
    );
  });

  it('should generate correct conversation log content', async () => {
    await runConversationUnified('test question', 1);

    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('System Prompt for LLM1')
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('LLM1 responds:')
    );
  });

  it('should handle LLM1 errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (llm.callLLM1Unified as jest.Mock).mockRejectedValue(new Error('LLM1 error'));

    await runConversationUnified('test', 2);

    expect(consoleSpy).toHaveBeenCalledWith('Stopping conversation due to an error from LLM1.');
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('Error from LLM1:')
    );
    
    consoleSpy.mockRestore();
  });

  it('should handle LLM2 errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (llm.callLLM2Unified as jest.Mock).mockRejectedValue(new Error('LLM2 error'));

    await runConversationUnified('test', 2);

    expect(consoleSpy).toHaveBeenCalledWith('Stopping conversation due to an error from LLM2.');
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('Error from LLM2:')
    );
    
    consoleSpy.mockRestore();
  });

  it('should handle file system errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (fs.writeFile as jest.Mock).mockRejectedValue(new Error('File system error'));

    await expect(runConversationUnified('test', 1))
      .rejects
      .toThrow('File system error');

    consoleSpy.mockRestore();
  });
});