/**
 * Main Agent class for MiniMax AI
 * Provides a high-level interface for interacting with MiniMax-M2.1
 * Uses Zod validation with tool calling support
 */

import { MiniMaxClient, createClient } from './client';
import { config, validateConfig, hasApiKey } from './config';
import {
  ChatRequest,
  Message,
  StreamChunk,
  AgentOptions,
  AgentOptionsSchema,
  ToolCall,
} from './schemas';
import {
  ToolDefinition,
  ToolResult,
} from './model';

/**
 * Agent initialization options extended with tools
 */
export interface AgentOptionsWithTools extends AgentOptions {
  tools?: ToolDefinition[];
  maxToolIterations?: number;
}

/**
 * Main Agent class
 * Provides a simple interface for sending messages, streaming responses, and tool calls
 */
export class Agent {
  private client: MiniMaxClient;
  private systemMessage: string;
  private friendContext: string;
  private conversation: Message[];
  private maxHistoryLength: number;
  private tools: Map<string, ToolDefinition>;
  private maxToolIterations: number;

  constructor(options: AgentOptionsWithTools = {}) {
    // Validate options with Zod
    const validation = AgentOptionsSchema.safeParse(options);
    const validated = validation.success ? validation.data : {};

    this.client = createClient(validated.apiKey);
    this.systemMessage = validated.systemMessage || '';
    this.friendContext = '';
    this.conversation = [];
    this.maxHistoryLength = validated.maxHistoryLength || 50;
    this.maxToolIterations = validated.maxToolIterations || 10;
    this.tools = new Map();

    // Register tools
    if (options.tools) {
      for (const tool of options.tools) {
        this.tools.set(tool.name, tool);
      }
    }

    // Apply default settings
    if (validated.temperature) {
      config.temperature = validated.temperature;
    }
    if (validated.maxTokens) {
      config.maxTokens = validated.maxTokens;
    }
  }

  /**
   * Send a message and get a response (with tool execution)
   */
  async send(message: string): Promise<string> {
    // Check configuration
    if (!hasApiKey()) {
      const validation = validateConfig();
      if (!validation.valid) {
        throw new Error(`Configuration error: ${validation.errors.join(', ')}`);
      }
    }

    // Build messages array
    const messages: Message[] = [];

    // Build context from system message and friend context
    let fullContext = this.systemMessage;
    if (this.friendContext) {
      fullContext += '\n\n=== CURRENT FRIEND DATA ===\n' + this.friendContext;
    }

    if (fullContext) {
      messages.push({ role: 'system', content: fullContext });
    }

    // Add conversation history
    messages.push(...this.conversation);

    // Add user message
    messages.push({ role: 'user', content: message });

    // Send request and handle tool calls
    const response = await this.sendWithTools(messages);

    // Update conversation history
    this.conversation.push({ role: 'user', content: message });
    this.conversation.push({
      role: 'assistant',
      content: response,
    });

    // Trim history if it exceeds max length
    this.trimHistory();

    return response;
  }

  /**
   * Send messages and handle tool execution
   */
  private async sendWithTools(messages: Message[]): Promise<string> {
    let currentMessages = [...messages];
    let iterations = 0;

    while (iterations < this.maxToolIterations) {
      // Convert tools to API format
      const toolsArray: { type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }[] = [];
      for (const tool of Array.from(this.tools.values())) {
        toolsArray.push({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema.shape as Record<string, unknown>,
          },
        });
      }

      // Send request
      const request: ChatRequest = {
        messages: currentMessages,
        stream: false,
        tools: toolsArray.length > 0 ? toolsArray : undefined,
        reasoningSplit: true,
      };

      const response = await this.client.chat(request);
      const choice = response.choices?.[0];

      if (!choice) {
        throw new Error('No response from MiniMax');
      }

      const assistantMessage = choice.message;

      // Check for tool calls
      const toolCalls = response.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        // Execute tool calls
        const toolResults = await this.executeTools(toolCalls);

        // Append assistant message with tool calls to history
        currentMessages.push({
          role: 'assistant',
          content: assistantMessage.content,
          tool_calls: toolCalls,
        } as Message & { tool_calls?: ToolCall[] });

        // Append tool results to history in MiniMax format
        for (const result of toolResults) {
          currentMessages.push({
            role: 'tool' as const,
            tool_call_id: result.toolCallId,
            content: typeof result.result === 'string'
              ? result.result
              : JSON.stringify(result.result),
          });
        }

        iterations++;
        continue;
      }

      // No more tool calls, return the response
      return typeof assistantMessage.content === 'string'
        ? assistantMessage.content
        : JSON.stringify(assistantMessage.content);
    }

    throw new Error(
      `Max tool iterations (${this.maxToolIterations}) exceeded`
    );
  }

  /**
   * Execute tool calls and return results
   */
  private async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const toolCall of toolCalls) {
      const { id, function: func } = toolCall;
      const toolName = func.name;
      const args = JSON.parse(func.arguments);

      const tool = this.tools.get(toolName);
      if (!tool) {
        results.push({
          toolCallId: id,
          toolName,
          success: false,
          result: null,
          error: `Tool '${toolName}' not found`,
        });
        continue;
      }

      try {
        // Validate input against schema
        const parseResult = tool.inputSchema.safeParse(args);
        if (!parseResult.success) {
          results.push({
            toolCallId: id,
            toolName,
            success: false,
            result: null,
            error: `Invalid arguments: ${parseResult.error.message}`,
          });
          continue;
        }

        // Execute the tool
        const result = await tool.execute(parseResult.data);
        results.push({
          toolCallId: id,
          toolName,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          toolCallId: id,
          toolName,
          success: false,
          result: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Send a message and stream the response
   */
  async *sendStream(message: string): AsyncGenerator<string> {
    // Check configuration
    if (!hasApiKey()) {
      const validation = validateConfig();
      if (!validation.valid) {
        throw new Error(`Configuration error: ${validation.errors.join(', ')}`);
      }
    }

    // Build messages array
    const messages: Message[] = [];

    // Build context from system message and friend context
    let fullContext = this.systemMessage;
    if (this.friendContext) {
      fullContext += '\n\n=== CURRENT FRIEND DATA ===\n' + this.friendContext;
    }

    if (fullContext) {
      messages.push({ role: 'system', content: fullContext });
    }

    // Add conversation history
    messages.push(...this.conversation);

    // Add user message
    messages.push({ role: 'user', content: message });

    // Update conversation history with partial assistant message
    const assistantMessage: Message = { role: 'assistant', content: '' };
    this.conversation.push({ role: 'user', content: message });
    this.conversation.push(assistantMessage);

    // Stream request (note: streaming with tools requires special handling)
    const request: ChatRequest = { messages, stream: true, reasoningSplit: true };

    // Stream response
    for await (const chunk of this.client.streamChat(request)) {
      const delta = chunk.choices[0]?.delta?.content;
      if (typeof delta === 'string' && delta) {
        if (typeof assistantMessage.content === 'string') {
          assistantMessage.content += delta;
        } else {
          assistantMessage.content = delta;
        }
        yield delta;
      }
    }

    // Trim history after streaming completes
    this.trimHistory();
  }

  /**
   * Send a message with callbacks for streaming
   */
  async sendStreamWithCallbacks(
    message: string,
    onChunk: (chunk: StreamChunk) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    // Check configuration
    if (!hasApiKey()) {
      const validation = validateConfig();
      if (!validation.valid) {
        throw new Error(`Configuration error: ${validation.errors.join(', ')}`);
      }
    }

    // Build messages array
    const messages: Message[] = [];

    // Build context from system message and friend context
    let fullContext = this.systemMessage;
    if (this.friendContext) {
      fullContext += '\n\n=== CURRENT FRIEND DATA ===\n' + this.friendContext;
    }

    if (fullContext) {
      messages.push({ role: 'system', content: fullContext });
    }

    // Add conversation history
    messages.push(...this.conversation);

    // Add user message
    messages.push({ role: 'user', content: message });

    // Update conversation history
    this.conversation.push({ role: 'user', content: message });
    this.conversation.push({ role: 'assistant', content: '' });

    // Stream request with explicit stream: true
    const request: ChatRequest = { messages, stream: true, reasoningSplit: true };

    // Stream with callbacks
    let fullResponse = '';
    await this.client.streamWithCallbacks(
      request,
      (chunk) => {
        onChunk(chunk);
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          fullResponse += delta;
          this.conversation[this.conversation.length - 1].content = fullResponse;
        }
      },
      onError
    );

    // Trim history
    this.trimHistory();
  }

  /**
   * Register a tool
   */
  addTool<TInput = Record<string, unknown>>(tool: ToolDefinition<TInput>): void {
    this.tools.set(tool.name, tool as ToolDefinition);
  }

  /**
   * Register multiple tools
   */
  addTools<TInput = Record<string, unknown>>(tools: ToolDefinition<TInput>[]): void {
    for (const tool of tools) {
      this.tools.set(tool.name, tool as ToolDefinition);
    }
  }

  /**
   * Remove a tool
   */
  removeTool(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get all registered tools
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Trim conversation history to max length
   */
  private trimHistory(): void {
    // Calculate max messages we can store (subtract 1 for system message if present)
    const hasSystemContext = this.systemMessage || this.friendContext;
    const maxMessages = hasSystemContext
      ? this.maxHistoryLength - 1
      : this.maxHistoryLength;

    if (this.conversation.length > maxMessages) {
      // Keep system message and the most recent messages
      const systemMessage = hasSystemContext
        ? [{ role: 'system' as const, content: this.systemMessage + (this.friendContext ? '\n\n=== CURRENT FRIEND DATA ===\n' + this.friendContext : '') }]
        : [];
      const recentMessages = this.conversation.slice(-maxMessages);
      this.conversation = [...systemMessage, ...recentMessages];
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversation = [];
  }

  /**
   * Set system message
   */
  setSystemMessage(message: string): void {
    this.systemMessage = message;
  }

  /**
   * Set friend context for gift recommendations
   */
  setFriendContext(context: string): void {
    this.friendContext = context;
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return [...this.conversation];
  }

  /**
   * Get number of messages in history
   */
  getHistoryLength(): number {
    return this.conversation.length;
  }

  /**
   * Check if agent is configured correctly
   */
  isConfigured(): boolean {
    return hasApiKey();
  }

  /**
   * Update agent options at runtime
   */
  updateOptions(options: Partial<AgentOptionsWithTools>): void {
    const validation = AgentOptionsSchema.partial().safeParse(options);
    if (validation.success) {
      const opts = validation.data;
      if (opts.systemMessage !== undefined) {
        this.systemMessage = opts.systemMessage;
      }
      if (opts.maxHistoryLength !== undefined) {
        this.maxHistoryLength = opts.maxHistoryLength;
      }
      if (opts.maxToolIterations !== undefined) {
        this.maxToolIterations = opts.maxToolIterations;
      }
      if (opts.temperature !== undefined) {
        config.temperature = opts.temperature;
      }
      if (opts.maxTokens !== undefined) {
        config.maxTokens = opts.maxTokens;
      }
    }
  }
}

/**
 * Create a new agent instance
 */
export function createAgent(options?: AgentOptionsWithTools): Agent {
  return new Agent(options);
}
