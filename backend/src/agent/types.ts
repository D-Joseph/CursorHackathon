/**
 * Type definitions for the MiniMax Agent
 */

/**
 * Represents a message in a conversation
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Configuration for the MiniMax client
 */
export interface MiniMaxConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Request options for sending messages to MiniMax
 */
export interface ChatRequest {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/**
 * Response from MiniMax API
 */
export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage?: Usage;
}

/**
 * A single choice in the response
 */
export interface Choice {
  index: number;
  message: Message;
  finishReason: string | null;
}

/**
 * Token usage information
 */
export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Stream chunk from MiniMax streaming API
 */
export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: StreamChoice[];
}

/**
 * A single streaming choice
 */
export interface StreamChoice {
  index: number;
  delta: Partial<Message>;
  finishReason: string | null;
}

/**
 * Event callback for streaming responses
 */
export type StreamEventCallback = (chunk: StreamChunk) => void;

/**
 * Error callback for streaming
 */
export type StreamErrorCallback = (error: Error) => void;
