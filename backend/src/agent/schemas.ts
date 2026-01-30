/**
 * Zod Validation Schemas for MiniMax Agent
 * Provides runtime validation for all inputs and API responses
 */

import { z } from 'zod';

// Message role enum
export const MessageRoleSchema = z.enum(['system', 'user', 'assistant', 'tool']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

/**
 * Tool call function definition
 */
export const ToolCallFunctionSchema = z.object({
  name: z.string(),
  arguments: z.string(),
});
export type ToolCallFunction = z.infer<typeof ToolCallFunctionSchema>;

/**
 * A single tool call from the model
 */
export const ToolCallSchema = z.object({
  id: z.string(),
  type: z.literal('function'),
  function: ToolCallFunctionSchema,
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

/**
 * Represents a message in a conversation
 */
export const MessageSchema = z.object({
  role: MessageRoleSchema,
  content: z.union([z.string(), z.array(z.unknown())]).optional(),
  tool_calls: z.array(ToolCallSchema).optional(),
  reasoning_details: z
    .array(
      z.object({
        type: z.string(),
        text: z.string(),
      })
    )
    .optional(),
}).passthrough();
export type Message = z.infer<typeof MessageSchema>;

/**
 * Tool result content block
 */
export const ToolResultContentSchema = z.object({
  type: z.literal('tool_result'),
  tool_use_id: z.string(),
  content: z.string(),
});
export type ToolResultContent = z.infer<typeof ToolResultContentSchema>;

/**
 * Tool result message
 */
export const ToolMessageSchema = z.object({
  role: z.literal('tool'),
  content: z.union([z.string(), z.array(ToolResultContentSchema)]),
}).passthrough();
export type ToolMessage = z.infer<typeof ToolMessageSchema>;

/**
 * Tool definition for the model
 */
export const ToolSchema = z.object({
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.unknown()),
  }),
});
export type Tool = z.infer<typeof ToolSchema>;

/**
 * Configuration schema for the MiniMax client
 */
export const MiniMaxConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  baseUrl: z
    .string()
    .url('Base URL must be a valid URL')
    .default('https://api.minimax.io'),
  model: z.string().min(1, 'Model name is required').default('MiniMax-M2.1'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(4096),
  timeout: z.number().positive().default(60000),
});
export type MiniMaxConfig = z.infer<typeof MiniMaxConfigSchema>;

/**
 * Request options for sending messages to MiniMax
 */
export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1, 'At least one message is required'),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  stream: z.boolean().optional().default(false),
  tools: z.array(ToolSchema).optional(),
  reasoningSplit: z.boolean().optional().default(true),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Choice schema from MiniMax API response
 */
export const ChoiceSchema = z.object({
  index: z.number(),
  message: MessageSchema,
  finishReason: z.string().nullable().optional(),
});
export type Choice = z.infer<typeof ChoiceSchema>;

/**
 * Token usage information
 */
export const UsageSchema = z.object({
  promptTokens: z.number().optional(),
  completionTokens: z.number().optional(),
  totalTokens: z.number().optional(),
});
export type Usage = z.infer<typeof UsageSchema>;

/**
 * Response from MiniMax API
 */
export const ChatResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(ChoiceSchema).optional().nullable(),
  usage: UsageSchema.optional().nullable(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

/**
 * Streaming choice schema
 */
export const StreamChoiceSchema = z.object({
  index: z.number(),
  delta: MessageSchema.partial(),
  finishReason: z.string().nullable(),
});
export type StreamChoice = z.infer<typeof StreamChoiceSchema>;

/**
 * Stream chunk from MiniMax streaming API
 */
export const StreamChunkSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(StreamChoiceSchema),
});
export type StreamChunk = z.infer<typeof StreamChunkSchema>;

/**
 * Agent initialization options schema
 */
export const AgentOptionsSchema = z.object({
  apiKey: z.string().optional(),
  systemMessage: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  maxHistoryLength: z.number().positive().optional(),
  maxToolIterations: z.number().positive().optional(),
});
export type AgentOptions = z.infer<typeof AgentOptionsSchema>;

/**
 * Validation helper functions
 */
export function validateConfig(config: unknown): {
  success: boolean;
  data?: MiniMaxConfig;
  error?: z.ZodError;
} {
  const result = MiniMaxConfigSchema.safeParse(config);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateChatRequest(request: unknown): {
  success: boolean;
  data?: ChatRequest;
  error?: z.ZodError;
} {
  const result = ChatRequestSchema.safeParse(request);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

export function validateApiKey(apiKey: unknown): boolean {
  return typeof apiKey === 'string' && apiKey.length > 0;
}
