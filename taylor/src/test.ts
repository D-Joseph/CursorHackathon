/**
 * Simple test file for MiniMax Agent with one tool call
 */

import { createAgent } from './agent';
import { validateConfig, hasApiKey } from './config';
import { createMiniMaxChatModel, calculatorTool } from './model';

async function main() {
  console.log('=== MiniMax Agent Test ===\n');

  // Check configuration
  console.log('--- Configuration Check ---');
  const isConfigured = hasApiKey();
  console.log(`API Key configured: ${isConfigured}`);

  if (!isConfigured) {
    console.log('Please set your MiniMax API key in .env file');
    return;
  }
  console.log('✓ Configuration validated\n');

  // Test 1: Basic chat
  console.log('--- Test 1: Basic Chat ---');
  const agent = createAgent({
    systemMessage: 'You are a helpful assistant.',
  });

  try {
    console.log('User: "Hello, how are you?"');
    const response = await agent.send('Hello, how are you?');
    console.log(`Assistant: "${response}"\n`);
  } catch (error) {
    console.error('Error in Test 1:', error);
  }

  // Test 2: Tool call with calculator
  console.log('--- Test 2: Tool Call (Calculator) ---');
  const agentWithTools = createAgent({
    systemMessage: 'You are a helpful assistant with access to tools. Use the calculator tool for math questions.',
    maxToolIterations: 3, // Reduced to avoid long waits
  });
  agentWithTools.addTool(calculatorTool);
  console.log('Tool registered: calculator\n');

  try {
    console.log('User: "What is 42 * 42?"');
    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 20s')), 20000)
    );
    const responsePromise = agentWithTools.send('What is 42 * 42?');
    const response = await Promise.race([responsePromise, timeoutPromise]);
    console.log(`Assistant: "${response}"\n`);
  } catch (error) {
    console.error('Error in Test 2:', error);
  }

  console.log('=== Tests completed ===');
}

main().catch(console.error);
