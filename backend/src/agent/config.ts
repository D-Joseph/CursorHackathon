/**
 * Configuration module for MiniMax Agent
 * Edit this file to set your API credentials and preferences
 */

import { MiniMaxConfigSchema } from './schemas';

// Get environment variables with proper typing
function getEnv(): {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
} {
  return {
    apiKey: process.env.MINIMAX_API_KEY,
    baseUrl: process.env.MINIMAX_BASE_URL,
    model: process.env.MINIMAX_MODEL,
    temperature: process.env.MINIMAX_TEMPERATURE
      ? parseFloat(process.env.MINIMAX_TEMPERATURE)
      : undefined,
    maxTokens: process.env.MINIMAX_MAX_TOKENS
      ? parseInt(process.env.MINIMAX_MAX_TOKENS, 10)
      : undefined,
    timeout: process.env.MINIMAX_TIMEOUT
      ? parseInt(process.env.MINIMAX_TIMEOUT, 10)
      : undefined,
  };
}

// Build configuration from environment variables
function buildConfigFromEnv(): Partial<import('./schemas').MiniMaxConfig> {
  const env = getEnv();
  const config: Partial<import('./schemas').MiniMaxConfig> = {};

  if (env.apiKey) config.apiKey = env.apiKey;
  if (env.baseUrl) config.baseUrl = env.baseUrl;
  if (env.model) config.model = env.model;
  if (env.temperature !== undefined) config.temperature = env.temperature;
  if (env.maxTokens !== undefined) config.maxTokens = env.maxTokens;
  if (env.timeout !== undefined) config.timeout = env.timeout;

  return config;
}

// Export the validated config
export const config = (() => {
  const envConfig = buildConfigFromEnv();
  const result = MiniMaxConfigSchema.safeParse(envConfig);

  if (result.success) {
    return result.data;
  }

  // Fallback to defaults if validation fails (e.g., missing API key during import)
  return {
    apiKey: '',
    baseUrl: 'https://api.minimax.io',
    model: 'MiniMax-M2.1',
    temperature: 0.7,
    maxTokens: 4096,
    timeout: 60000,
  };
})();

/**
 * Validate configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const result = MiniMaxConfigSchema.safeParse(config);

  if (result.success) {
    return { valid: true, errors: [] };
  }

  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });

  return { valid: false, errors };
}

/**
 * Check if API key is configured
 */
export function hasApiKey(): boolean {
  return config.apiKey.length > 0;
}

/**
 * Update configuration at runtime
 */
export function updateConfig(
  updates: Partial<import('./schemas').MiniMaxConfig>
): void {
  Object.assign(config, updates);
}
