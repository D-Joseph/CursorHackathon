/**
 * MiniMax Chat Model
 * A simple chat model wrapper for MiniMax API with tool support
 */

import { z } from 'zod';
import { config } from './config';
import {
  Message,
  ChatResponseSchema,
  StreamChunkSchema,
  Tool,
  ToolCall,
} from './schemas';

/**
 * Tool definition for the agent
 */
export interface ToolDefinition<TInput = Record<string, unknown>> {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  outputSchema: z.ZodObject<z.ZodRawShape>;
  execute: (input: TInput) => Promise<Record<string, unknown>>;
}

/**
 * Result of executing a tool
 */
export interface ToolResult {
  toolCallId: string;
  toolName: string;
  success: boolean;
  result: unknown;
  error?: string;
}

/**
 * Convert a ToolDefinition to MiniMax API tool format
 */
function toolDefinitionToSchema(tool: ToolDefinition) {
  return {
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema.shape,
    },
  };
}

/**
 * MiniMax Chat Model class
 * Provides a clean interface for chat completions, streaming, and tool calls
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
  async generate(
    messages: Message[],
    options?: {
      tools?: ToolDefinition[];
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
    reasoningDetails?: Array<{ type: string; text: string }>;
  }> {
    const endpoint = `${this.baseUrl}/v1/text/chatcompletion_v2`;

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? this.temperature,
      max_tokens: options?.maxTokens ?? this.maxTokens,
      stream: false,
      reasoning_split: true,
    };

    // Add tools if provided
    if (options?.tools && options.tools.length > 0) {
      body.tools = options.tools.map(toolDefinitionToSchema);
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

    const chatResponse = ChatResponseSchema.parse(data);

    // Check if choices is present and has content
    if (!chatResponse.choices || chatResponse.choices.length === 0) {
      throw new Error('No response choices from MiniMax');
    }

    const choice = chatResponse.choices[0];

    if (!choice) {
      throw new Error('No response from MiniMax');
    }

    // Extract tool_calls if present
    let toolCalls: ToolCall[] | undefined;
    if ('tool_calls' in choice.message && choice.message.tool_calls) {
      toolCalls = choice.message.tool_calls as ToolCall[];
    }

    // Extract reasoning_details if present
    let reasoningDetails:
      | Array<{ type: string; text: string }>
      | undefined;
    if ('reasoning_details' in choice.message && choice.message.reasoning_details) {
      reasoningDetails = choice.message.reasoning_details as Array<{
        type: string;
        text: string;
      }>;
    }

    return {
      content: typeof choice.message.content === 'string'
        ? choice.message.content
        : JSON.stringify(choice.message.content),
      toolCalls,
      reasoningDetails,
    };
  }

  /**
   * Stream a chat response
   */
  async *stream(
    messages: Message[],
    options?: {
      tools?: ToolDefinition[];
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncGenerator<string> {
    const endpoint = `${this.baseUrl}/v1/text/chatcompletion_v2`;

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? this.temperature,
      max_tokens: options?.maxTokens ?? this.maxTokens,
      stream: true,
      reasoning_split: true,
    };

    // Add tools if provided
    if (options?.tools && options.tools.length > 0) {
      body.tools = options.tools.map(toolDefinitionToSchema);
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
              const delta = chunk.choices[0]?.delta?.content;
              if (typeof delta === 'string' && delta) {
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
 * Create a tool definition
 */
export function createToolDefinition<TInput = Record<string, unknown>>(
  config: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<z.ZodRawShape>;
    outputSchema: z.ZodObject<z.ZodRawShape>;
    execute: (input: TInput) => Promise<Record<string, unknown>>;
  }
): ToolDefinition<TInput> {
  return {
    name: config.name,
    description: config.description,
    inputSchema: config.inputSchema,
    outputSchema: config.outputSchema,
    execute: config.execute,
  } as ToolDefinition<TInput>;
}

/**
 * Example weather tool (mock implementation)
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
  execute: async (_input: WeatherInput) => {
    // Mock implementation - in real use, call a weather API
    return {
      temperature: 72,
      condition: 'sunny',
      humidity: 45,
    };
  },
});

/**
 * Example calculator tool (mock implementation)
 */
export const calculatorTool = createToolDefinition({
  name: 'calculator',
  description: 'Perform basic arithmetic calculations',
  inputSchema: z.object({
    expression: z
      .string()
      .describe('A mathematical expression like "2 + 2" or "10 * 5"'),
  }),
  outputSchema: z.object({
    result: z.number(),
    expression: z.string(),
  }),
  execute: async (input: { expression: string }) => {
    // Safe mock implementation - validates and parses simple math expressions
    try {
      // Only allow numbers, basic operators, parentheses, and spaces
      const sanitized = input.expression.replace(/[^0-9+\-*/().\s]/g, '');
      if (!sanitized || sanitized.length === 0) {
        return { result: 0, expression: input.expression };
      }

      // Use Function constructor instead of eval for slightly better isolation
      // Still only for demo purposes - use mathjs library in production
      const result = new Function(`return ${sanitized}`)();
      return {
        result: Number(result),
        expression: input.expression,
      };
    } catch {
      return {
        result: 0,
        expression: input.expression,
      };
    }
  },
});

/**
 * Example search tool (mock implementation)
 */
export const searchTool = createToolDefinition({
  name: 'search',
  description: 'Search for information on the web',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
      })
    ),
  }),
  execute: async (_input: { query: string }) => {
    // Mock implementation - in real use, call a search API
    return {
      results: [
        {
          title: 'Example Result',
          url: 'https://example.com',
          snippet: 'This is a mock search result.',
        },
      ],
    };
  },
});

/**
 * Import the shopping search functionality
 */
import { searchShoppingItems } from '../tools/shopping';

/**
 * Input schema for shopping search tool
 */
export const ShoppingSearchInputSchema = z.object({
  searchTerm: z.string().describe('The search term for shopping items (e.g., "lego toy", "wireless headphones")'),
  maxResults: z.number().min(1).max(20).optional().default(10).describe('Maximum number of results to return'),
  priceRange: z.object({
    min: z.number().optional().describe('Minimum price in USD'),
    max: z.number().optional().describe('Maximum price in USD'),
  }).optional().describe('Optional price range filter for results'),
  category: z.string().optional().describe('Category to filter results (e.g., "electronics", "clothing", "home")'),
  brand: z.string().optional().describe('Brand preference to filter results'),
  onlyReviewed: z.boolean().optional().default(false).describe('Whether to include only items with reviews/ratings'),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'rating', 'newest']).optional().default('relevance').describe('Sort order for results'),
});

export type ShoppingSearchInput = z.infer<typeof ShoppingSearchInputSchema>;

/**
 * Shopping search tool definition
 * Uses the shopping search service to find products
 */
export const shoppingTool = createToolDefinition({
  name: 'shopping_search',
  description: 'Search for shopping items based on a search term. Use this tool when the user wants to find products to buy. Returns a list of products with prices, ratings, and links.',
  inputSchema: ShoppingSearchInputSchema,
  outputSchema: z.object({
    success: z.boolean(),
    products: z.array(
      z.object({
        name: z.string(),
        price: z.number(),
        rating: z.number().optional(),
        reviews: z.number().optional(),
        link: z.string(),
        description: z.string().optional(),
      })
    ).optional(),
    error: z.string().optional(),
  }),
  execute: async (input: ShoppingSearchInput): Promise<Record<string, unknown>> => {
    const result = await searchShoppingItems({
      searchTerm: input.searchTerm,
      maxResults: input.maxResults,
      priceRange: input.priceRange,
      category: input.category,
      brand: input.brand,
      onlyReviewed: input.onlyReviewed,
      sortBy: input.sortBy,
    });

    if (result.success && result.results.length > 0) {
      return {
        success: true,
        products: result.results.map(item => ({
          name: item.title,
          price: item.price?.value ?? 0,
          rating: item.rating?.score,
          reviews: item.rating?.reviewCount,
          link: item.url,
          description: item.snippet,
        })),
      };
    }

    return {
      success: false,
      error: result.error || 'No products found',
    };
  },
});
