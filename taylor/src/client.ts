/**
 * MiniMax HTTP Client
 * Handles communication with the MiniMax API with Zod validation
 */

import { z } from 'zod';
import { config } from './config';
import {
  ChatRequest,
  ChatResponse,
  StreamChunk,
  Message,
  validateChatRequest,
  ChatResponseSchema,
  StreamChunkSchema,
  ToolCall,
  ToolCallSchema,
} from './schemas';

/**
 * Chat response with tool calls parsed
 */
export interface ChatResponseWithTools extends ChatResponse {
  tool_calls?: ToolCall[];
  reasoning_details?: Array<{
    type: string;
    text: string;
  }>;
}

/**
 * MiniMax HTTP Client class for API communication
 */
export class MiniMaxClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private timeout: number;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.apiKey;
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    this.timeout = config.timeout;
  }

  /**
   * Send a chat request and get a response
   */
  async chat(request: ChatRequest): Promise<ChatResponseWithTools> {
    // Validate request
    const validation = validateChatRequest(request);
    if (!validation.success) {
      throw new Error(`Invalid request: ${validation.error?.message}`);
    }

    const endpoint = `${this.baseUrl}/v1/text/chatcompletion_v2`;

    const body: Record<string, unknown> = {
      model: this.model,
      messages: validation.data!.messages,
      temperature: validation.data!.temperature ?? config.temperature,
      max_tokens: validation.data!.maxTokens ?? config.maxTokens,
      stream: false,
    };

    // Add tools if provided
    if (validation.data!.tools && validation.data!.tools.length > 0) {
      body.tools = validation.data!.tools;
    }

    // Add reasoning_split for interleaved thinking
    if (validation.data!.reasoningSplit !== undefined) {
      body.reasoning_split = validation.data!.reasoningSplit;
    }

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

    const data = await response.json() as Record<string, unknown>;

    // Check for API-level errors in the response body
    if (data.base_resp && (data.base_resp as Record<string, unknown>).status_code !== 0) {
      const baseResp = data.base_resp as Record<string, unknown>;
      throw new Error(`MiniMax API error: ${baseResp.status_msg} (code: ${baseResp.status_code})`);
    }

    const chatResponse = ChatResponseSchema.parse(data as object) as ChatResponseWithTools;

    // Safely extract tool_calls and reasoning_details from the raw response
    const rawData = data;
    const choices = rawData?.choices as unknown[] | undefined;
    const firstChoice = choices?.[0] as Record<string, unknown> | undefined;
    const messageData = firstChoice?.message as Record<string, unknown> | undefined;

    if (messageData && typeof messageData === 'object') {
      if ('tool_calls' in messageData && messageData.tool_calls) {
        const toolCallsResult = z.array(ToolCallSchema).safeParse(messageData.tool_calls);
        chatResponse.tool_calls = toolCallsResult.success ? toolCallsResult.data : undefined;
      }

      if ('reasoning_details' in messageData && messageData.reasoning_details) {
        const reasoningResult = z.array(z.object({
          type: z.string(),
          text: z.string(),
        })).safeParse(messageData.reasoning_details);
        chatResponse.reasoning_details = reasoningResult.success ? reasoningResult.data : undefined;
      }
    }

    return chatResponse;
  }

  /**
   * Send a chat request and stream the response
   */
  async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
    // Validate request
    const validation = validateChatRequest(request);
    if (!validation.success) {
      throw new Error(`Invalid request: ${validation.error?.message}`);
    }

    const endpoint = `${this.baseUrl}/v1/text/chatcompletion_v2`;

    const body: Record<string, unknown> = {
      model: this.model,
      messages: validation.data!.messages,
      temperature: validation.data!.temperature ?? config.temperature,
      max_tokens: validation.data!.maxTokens ?? config.maxTokens,
      stream: true,
    };

    // Add tools if provided
    if (validation.data!.tools && validation.data!.tools.length > 0) {
      body.tools = validation.data!.tools;
    }

    // Add reasoning_split for interleaved thinking
    if (validation.data!.reasoningSplit !== undefined) {
      body.reasoning_split = validation.data!.reasoningSplit;
    }

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
              yield chunk;
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
   * Stream response with callbacks
   */
  async streamWithCallbacks(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      for await (const chunk of this.streamChat(request)) {
        onChunk(chunk);
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      } else {
        throw error;
      }
    }
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
 * Create a new client instance
 */
export function createClient(apiKey?: string): MiniMaxClient {
  return new MiniMaxClient(apiKey);
}
