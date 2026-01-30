/**
 * Simple test file for MiniMax Agent with tool calls
 */

import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import { createAgent } from './agent';
import { hasApiKey } from './agent/config';
import { calculatorTool, shoppingTool } from './agent/model';

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
  console.log('Configuration validated\n');

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
    systemMessage: 'You are a helpful assistant with access to tools. Use the calculator tool for math questions. After getting the tool result, provide a helpful answer without calling tools again.',
    maxToolIterations: 5,
  });
  agentWithTools.addTool(calculatorTool);
  console.log('Tool registered: calculator\n');

  try {
    console.log('User: "What is 42 * 42?"');
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 30s')), 30000)
    );
    const responsePromise = agentWithTools.send('What is 42 * 42?');
    const response = await Promise.race([responsePromise, timeoutPromise]);
    console.log(`Assistant: "${response}"\n`);
  } catch (error) {
    console.error('Error in Test 2:', error);
  }

  // Test 3: Tool call with shopping search
  console.log('--- Test 3: Tool Call (Shopping Search) ---');
  const agentWithShopping = createAgent({
    systemMessage: `You are a helpful shopping assistant. When users want to find products, use the shopping_search tool.

IMPORTANT: After calling the shopping_search tool, you will receive a JSON response with:
- success: boolean indicating if the search worked
- results: array of products with title, price, rating, url
- metadata: information about the search

If results are found (success=true and results array is not empty), ALWAYS present them to the user with:
- Product name and price
- Rating (if available)
- A brief description
- Link to purchase

Format your response clearly with prices in USD. Do not call tools again after receiving results.`,
    maxToolIterations: 5,
  });
  agentWithShopping.addTool(shoppingTool);
  console.log('Tool registered: shopping_search\n');

  try {
    console.log('User: "Find me some wireless headphones under $100"');
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 30s')), 30000)
    );
    const responsePromise = agentWithShopping.send('Find me some wireless headphones under $100');
    const response = await Promise.race([responsePromise, timeoutPromise]);
    console.log(`Assistant: "${response}"\n`);
  } catch (error) {
    console.error('Error in Test 3:', error);
  }

  console.log('=== Tests completed ===');
}

main().catch(console.error);
