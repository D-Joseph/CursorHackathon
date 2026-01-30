/**
 * Shopping Search Tool for LLM Agents
 *
 * This module provides a simple, importable function for LLM agents to search
 * for shopping items with clear input/output schemas.
 *
 * @module shopping
 *
 * @example
 * ```typescript
 * import { searchShoppingItems, ShoppingSearchInput, ShoppingItem, ShoppingSearchOutput } from './shopping';
 *
 * // Simple search
 * const result = await searchShoppingItems({
 *   searchTerm: "wireless headphones"
 * });
 *
 * // Search with filters
 * const filteredResult = await searchShoppingItems({
 *   searchTerm: "lego toy",
 *   maxResults: 5,
 *   priceRange: { min: 20, max: 100 },
 *   category: "toys",
 *   sortBy: "rating"
 * });
 *
 * if (filteredResult.success) {
 *   console.log(`Found ${filteredResult.metadata.totalResults} items`);
 *   filteredResult.results.forEach(item => {
 *     console.log(`- ${item.title}: $${item.price?.value}`);
 *     console.log(`  Rating: ${item.rating?.score}/5 (${item.rating?.reviewCount} reviews)`);
 *     console.log(`  Link: ${item.url}`);
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Using with OpenAI function calling
 * const tools = [
 *   {
 *     type: "function",
 *     function: {
 *       name: "search_shopping_items",
 *       description: "Search for shopping items based on a search term",
 *       parameters: {
 *         type: "object",
 *         properties: {
 *           searchTerm: {
 *             type: "string",
 *             description: "The search term for shopping items (e.g., 'lego toy', 'wireless headphones')"
 *           },
 *           maxResults: {
 *             type: "number",
 *             description: "Maximum number of results to return (default: 10, max: 20)"
 *           },
 *           priceRange: {
 *             type: "object",
 *             properties: {
 *               min: { type: "number", description: "Minimum price in USD" },
 *               max: { type: "number", description: "Maximum price in USD" }
 *             }
 *           },
 *           category: {
 *             type: "string",
 *             description: "Category to filter results (e.g., 'electronics', 'clothing', 'home')"
 *           },
 *           sortBy: {
 *             type: "string",
 *             enum: ["relevance", "price_asc", "price_desc", "rating", "newest"]
 *           }
 *         },
 *         required: ["searchTerm"]
 *       }
 *     }
 *   }
 * ];
 * ```
 */

// Re-export types for convenience
export type {
  ShoppingSearchInput,
  ShoppingItem,
  ShoppingSearchOutput,
  ShoppingSearchMetadata,
} from './types';

// Re-export the main function
export {
  searchShoppingItems,
  ShoppingSearchService,
  getShoppingSearchService,
} from './service';

// Re-export validation utilities
export {
  validateShoppingSearchInput,
  defaultShoppingSearchInput,
} from './types';
