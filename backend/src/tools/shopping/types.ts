/**
 * Type definitions for LLM Shopping Search Tool
 * Provides clear schemas for input/output to ensure LLM agents can call and expect structured output
 */

/**
 * Input schema for shopping search - what the LLM provides to the tool
 */
export interface ShoppingSearchInput {
  /**
   * The search term for shopping items (e.g., "lego toy", "wireless headphones")
   */
  searchTerm: string;

  /**
   * Maximum number of results to return (default: 10, max: 20)
   * @default 10
   */
  maxResults?: number;

  /**
   * Optional price range filter for results
   */
  priceRange?: {
    /**
     * Minimum price in USD
     */
    min?: number;
    /**
     * Maximum price in USD
     */
    max?: number;
  };

  /**
   * Optional category to filter results (e.g., "electronics", "clothing", "home")
   */
  category?: string;

  /**
   * Optional brand preference to filter results
   */
  brand?: string;

  /**
   * Whether to include only items with reviews/ratings
   * @default false
   */
  onlyReviewed?: boolean;

  /**
   * Sort order for results
   * @default "relevance"
   */
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

/**
 * Individual shopping item result from search
 */
export interface ShoppingItem {
  /**
   * Unique identifier for this item
   */
  id: string;

  /**
   * Title/product name of the item
   */
  title: string;

  /**
   * Direct URL to the product page
   */
  url: string;

  /**
   * Brief description or snippet from the search result
   */
  snippet: string;

  /**
   * Price information when available
   */
  price?: {
    /**
     * Current price value in USD
     */
    value: number;
    /**
     * Currency code (e.g., "USD")
     */
    currency: string;
    /**
     * Whether this price is discounted
     */
    isOnSale?: boolean;
    /**
     * Original price before discount (if on sale)
     */
    originalPrice?: number;
  };

  /**
   * Rating information when available
   */
  rating?: {
    /**
     * Average rating (0-5)
     */
    score: number;
    /**
     * Total number of reviews
     */
    reviewCount: number;
  };

  /**
   * Product image URL when available
   */
  imageUrl?: string;

  /**
   * Availability status
   */
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';

  /**
   * Merchant/source where the item was found
   */
  source: string;

  /**
   * Additional metadata about the item
   */
  metadata?: {
    /**
     * Product category
     */
    category?: string;
    /**
     * Brand/manufacturer
     */
    brand?: string;
    /**
     * Whether the result is an ad/sponsored listing
     */
    isSponsored?: boolean;
  };
}

/**
 * Search metadata for tracking and debugging
 */
export interface ShoppingSearchMetadata {
  /**
   * Original search query used
   */
  query: string;

  /**
   * Enhanced search query with filters applied
   */
  enhancedQuery?: string;

  /**
   * Total number of results found
   */
  totalResults: number;

  /**
   * Number of results returned in this response
   */
  returnedCount: number;

  /**
   * Time taken to execute search in milliseconds
   */
  searchTimeMs: number;

  /**
   * Source of the search results
   */
  source: 'google_custom_search' | 'serpapi' | 'mock_data';

  /**
   * Timestamp of when the search was executed
   */
  timestamp: string;
}

/**
 * Output schema for shopping search - what the LLM receives
 */
export interface ShoppingSearchOutput {
  /**
   * Whether the search was successful
   */
  success: boolean;

  /**
   * Array of shopping items matching the search criteria
   */
  results: ShoppingItem[];

  /**
   * Metadata about the search execution
   */
  metadata: ShoppingSearchMetadata;

  /**
   * Error message if search failed
   */
  error?: string;

  /**
   * Suggested refinements if results are sparse or unclear
   */
  suggestions?: string[];
}

/**
 * Helper function to validate ShoppingSearchInput
 * Returns an array of validation errors, empty if valid
 */
export function validateShoppingSearchInput(input: ShoppingSearchInput): string[] {
  const errors: string[] = [];

  if (!input.searchTerm || input.searchTerm.trim().length === 0) {
    errors.push('searchTerm is required and cannot be empty');
  }

  if (input.maxResults !== undefined) {
    if (input.maxResults < 1 || input.maxResults > 20) {
      errors.push('maxResults must be between 1 and 20');
    }
  }

  if (input.priceRange) {
    if (input.priceRange.min !== undefined && input.priceRange.min < 0) {
      errors.push('priceRange.min cannot be negative');
    }
    if (input.priceRange.max !== undefined && input.priceRange.max < 0) {
      errors.push('priceRange.max cannot be negative');
    }
    if (input.priceRange.min !== undefined && input.priceRange.max !== undefined && input.priceRange.min > input.priceRange.max) {
      errors.push('priceRange.min cannot be greater than priceRange.max');
    }
  }

  if (input.sortBy && !['relevance', 'price_asc', 'price_desc', 'rating', 'newest'].includes(input.sortBy)) {
    errors.push('sortBy must be one of: relevance, price_asc, price_desc, rating, newest');
  }

  return errors;
}

/**
 * Default values for ShoppingSearchInput
 */
export const defaultShoppingSearchInput: Partial<ShoppingSearchInput> = {
  maxResults: 10,
  onlyReviewed: false,
  sortBy: 'relevance',
};
