/**
 * Main entry point - export all public APIs
 */
export { Agent, createAgent } from './agent';
export { MiniMaxClient, createClient } from './client';
export { config, validateConfig, hasApiKey, updateConfig } from './config';
export {
  MessageSchema,
  MessageRoleSchema,
  ChatRequestSchema,
  ChatResponseSchema,
  StreamChunkSchema,
  AgentOptionsSchema,
  MiniMaxConfigSchema,
  validateConfig as validateConfigSchema,
  validateChatRequest,
  validateApiKey,
} from './schemas';
export * from './schemas';

// MiniMax chat model and tools
export {
  MiniMaxChatModel,
  createMiniMaxChatModel,
  createToolDefinition,
  weatherTool,
  WeatherInputSchema,
  ToolDefinition,
} from './model';
