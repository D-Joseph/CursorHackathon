/**
 * MiniMax Chat Model
 * A simple chat model wrapper for MiniMax API
 */

import { z } from 'zod';
import { config } from './config';
import { Message, ChatResponseSchema, StreamChunkSchema } from './schemas';

/**
 * MiniMax Chat Model class
 * Provides a clean interface for chat completions and streaming
 */
export class MiniMaxChatModel {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private timeout: number;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.apiKey;
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    this.temperature = config.temperature;
    this.maxTokens = config.maxTokens;
    this.timeout = config.timeout;
  }

  /**
   * Generate a chat response (non-streaming)
   */
  async generate(messages: Message[]): Promise<string> {
    const endpoint = `${this.baseUrl}/chat/completions`;

    const body = {
      model: this.model,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      stream: false,
    };

    const response = await this.fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const chatResponse = ChatResponseSchema.parse(data);
    const choice = chatResponse.choices[0];

    if (!choice) {
      throw new Error('No response from MiniMax');
    }

    return choice.message.content;
  }

  /**
   * Stream a chat response
   */
  async *stream(messages: Message[]): AsyncGenerator<string> {
    const endpoint = `${this.baseUrl}/chat/completions`;

    const body = {
      model: this.model,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      stream: true,
    };

    const response = await this.fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MiniMax API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const chunk = StreamChunkSchema.parse(data);
              const delta = chunk.choices[0]?.delta?.content;
              if (delta) {
                yield delta;
              }
            } catch {
              // Skip invalid JSON chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get the model name
   */
  get modelName(): string {
    return this.model;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.timeout}ms`);
      }
      throw error;
    }
  }
}

/**
 * Create a MiniMax chat model instance
 */
export function createMiniMaxChatModel(apiKey?: string): MiniMaxChatModel {
  return new MiniMaxChatModel(apiKey);
}

/**
 * Tool input schema for weather tool example
 */
export const WeatherInputSchema = z.object({
  city: z.string().describe('The city to get weather for'),
});

export type WeatherInput = z.infer<typeof WeatherInputSchema>;

/**
 * Example tool definition
 */
export interface ToolDefinition<TInput = Record<string, unknown>> {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  outputSchema: z.ZodObject<z.ZodRawShape>;
  execute: (input: TInput) => Promise<Record<string, unknown>>;
}

/**
 * Create a tool definition
 */
export function createToolDefinition<TInput = Record<string, unknown>>(config: {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  outputSchema: z.ZodObject<z.ZodRawShape>;
  execute: (input: TInput) => Promise<Record<string, unknown>>;
}): ToolDefinition<TInput> {
  return {
    name: config.name,
    description: config.description,
    inputSchema: config.inputSchema,
    outputSchema: config.outputSchema,
    execute: config.execute,
  } as ToolDefinition<TInput>;
}

/**
 * Example weather tool
 */
export const weatherTool = createToolDefinition({
  name: 'weather',
  description: 'Get the current weather for a city',
  inputSchema: WeatherInputSchema,
  outputSchema: z.object({
    temperature: z.number(),
    condition: z.string(),
    humidity: z.number(),
  }),
  execute: async (input: WeatherInput) => {
    // Mock implementation
    return {
      temperature: 72,
      condition: 'sunny',
      humidity: 45,
    };
  },
});
