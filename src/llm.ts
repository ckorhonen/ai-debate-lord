// c:\Users\yepis\dev\llm-dialog\llm.ts
import axios from 'axios';
import { LLM1_ENDPOINT, LLM2_ENDPOINT, LLM1_API_KEY, LLM2_API_KEY, LLM1_MODEL, LLM2_MODEL, systemPromptLLM1, systemPromptLLM2 } from './config';

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

export async function callLLMUnified(
  endpoint: string,
  apiKey: string,
  systemPrompt: string,
  originalQuestion: string,
  message: string,
  model: string
): Promise<string> {
  const isGoogleAPI = endpoint.toLowerCase().includes('googleapis');
  const url = isGoogleAPI ? `${endpoint}${model}:generateContent?key=${apiKey}` : endpoint;
  const payload = isGoogleAPI ? buildGeminiPayload(systemPrompt, originalQuestion, message) : buildOpenaiPayload(systemPrompt, message, model);

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    return isGoogleAPI ? response.data.candidates[0].content.parts[0].text.trim() : response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error calling LLM at ${url} with payload ${JSON.stringify(payload)}:`, error);
    throw error;
  }
}

export async function callLLM1Unified(originalQuestion: string, message: string): Promise<string> {
  return callLLMUnified(LLM1_ENDPOINT, LLM1_API_KEY, systemPromptLLM1, originalQuestion, message, LLM1_MODEL);
}

export async function callLLM2Unified(originalQuestion: string, message: string): Promise<string> {
  return callLLMUnified(LLM2_ENDPOINT, LLM2_API_KEY, systemPromptLLM2, originalQuestion, message, LLM2_MODEL);
}
