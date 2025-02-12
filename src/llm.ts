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

function normalizeEndpoint(endpoint: string): string {
  return endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
}

export async function callLLMUnified(
  endpoint: string,
  apiKey: string,
  systemPrompt: string,
  originalQuestion: string,
  message: string,
  model: string
): Promise<string> {
  if (!endpoint) {
    throw new Error('Endpoint URL is required');
  }

  const isGoogleAPI = endpoint.toLowerCase().includes('googleapis');
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const url = isGoogleAPI ? `${normalizedEndpoint}${model}:generateContent?key=${apiKey}` : normalizedEndpoint;
  const payload = isGoogleAPI ? buildGeminiPayload(systemPrompt, originalQuestion, message) : buildOpenaiPayload(systemPrompt, message, model);

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (isGoogleAPI && response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text.trim();
    } else if (!isGoogleAPI && response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content.trim();
    }
    throw new Error('Unexpected API response format');
  } catch (error) {
    console.error(`Error calling LLM at ${url}:`, error);
    throw error;
  }
}

export async function callLLM1Unified(originalQuestion: string, message: string): Promise<string> {
  return callLLMUnified(
    LLM1_ENDPOINT,
    LLM1_API_KEY,
    systemPromptLLM1(),
    originalQuestion,
    message,
    LLM1_MODEL
  );
}

export async function callLLM2Unified(originalQuestion: string, message: string): Promise<string> {
  return callLLMUnified(
    LLM2_ENDPOINT,
    LLM2_API_KEY,
    systemPromptLLM2(),
    originalQuestion,
    message,
    LLM2_MODEL
  );
}
