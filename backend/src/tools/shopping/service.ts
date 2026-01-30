import axios from 'axios';
import {
  ShoppingSearchInput,
  ShoppingItem,
  ShoppingSearchOutput,
  ShoppingSearchMetadata,
  validateShoppingSearchInput,
  defaultShoppingSearchInput,
} from './types';

/**
 * Generate a simple unique ID without external dependencies
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Shopping Search Service
 * Provides shopping search functionality optimized for LLM agent usage
 * Uses SerpApi with fallback to mock data
 */
export class ShoppingSearchService {
  private apiKey?: string;
  private baseUrl = 'https://serpapi.com/search';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for shopping items based on input criteria
   * This is the main entry point for LLM agents to search shopping items
   *
   * @param input - ShoppingSearchInput containing search term and filters
   * @returns ShoppingSearchOutput with structured results
   */
  async searchShoppingItems(input: ShoppingSearchInput): Promise<ShoppingSearchOutput> {
    const startTime = Date.now();
    const validatedInput = { ...defaultShoppingSearchInput, ...input };

    // Validate input
    const validationErrors = validateShoppingSearchInput(validatedInput);
    if (validationErrors.length > 0) {
      return this.createErrorOutput(
        `Invalid input: ${validationErrors.join(', ')}`,
        startTime
      );
    }

    // Construct enhanced query for shopping
    const enhancedQuery = this.constructShoppingQuery(validatedInput);

    try {
      let results: ShoppingItem[];
      let totalResults = 0;

      if (this.apiKey) {
        // Use SerpApi
        const apiResults = await this.serpApiSearch(enhancedQuery, validatedInput.maxResults || 10);
        results = apiResults.items;
        totalResults = apiResults.searchInformation?.totalResults || results.length;
      } else {
        // Fallback to mock data for development
        const mockResults = this.getMockShoppingResults(validatedInput.searchTerm, validatedInput.maxResults || 10);
        results = mockResults.items;
        totalResults = mockResults.searchInformation?.totalResults || results.length;
      }

      // Filter results by price range if specified
      if (validatedInput.priceRange) {
        results = this.filterByPriceRange(results, validatedInput.priceRange);
      }

      // Filter by category if specified
      if (validatedInput.category) {
        results = this.filterByCategory(results, validatedInput.category);
      }

      // Sort results if specified
      if (validatedInput.sortBy && validatedInput.sortBy !== 'relevance') {
        results = this.sortResults(results, validatedInput.sortBy);
      }

      const searchTimeMs = Date.now() - startTime;

      return this.createSuccessOutput(results, {
        query: validatedInput.searchTerm,
        enhancedQuery,
        totalResults,
        returnedCount: results.length,
        searchTimeMs,
        source: this.apiKey ? 'serpapi' : 'mock_data',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Shopping search error:', error);
      return this.createErrorOutput(
        error instanceof Error ? error.message : 'Failed to perform shopping search',
        startTime
      );
    }
  }

  /**
   * Construct an optimized shopping search query
   */
  private constructShoppingQuery(input: ShoppingSearchInput): string {
    let query = input.searchTerm;

    // Add shopping-related keywords to get better results
    const shoppingKeywords = ['buy', 'price', 'review'];
    query += ' ' + shoppingKeywords.join(' ');

    // Add category if specified
    if (input.category) {
      query += ` ${input.category}`;
    }

    // Add brand if specified
    if (input.brand) {
      query += ` ${input.brand}`;
    }

    // Add price range if specified
    if (input.priceRange) {
      if (input.priceRange.min !== undefined) {
        query += ` over $${input.priceRange.min}`;
      }
      if (input.priceRange.max !== undefined) {
        query += ` under $${input.priceRange.max}`;
      }
    }

    // Add review filter if requested
    if (input.onlyReviewed) {
      query += ' with reviews';
    }

    return query;
  }

  /**
   * Perform SerpApi search and convert results to ShoppingItem format
   * Uses google engine with tbm=shop for shopping results
   */
  private async serpApiSearch(query: string, limit: number): Promise<{ items: ShoppingItem[]; searchInformation: { totalResults: number } }> {
    const response = await axios.get(this.baseUrl, {
      params: {
        api_key: this.apiKey,
        q: query,
        engine: 'google',
        tbm: 'shop',  // Google Shopping tab
        num: Math.min(limit, 100),
        google_domain: 'google.com',
      },
    });

    const data = response.data;

    // Shopping results are in shopping_results when using tbm=shop
    const shoppingResults = Array.isArray(data.shopping_results) ? data.shopping_results : [];

    const items: ShoppingItem[] = shoppingResults.map((item: any) => ({
      id: generateId(),
      title: item.title || 'Unknown Product',
      url: item.product_link || item.link || item.url || '#',
      snippet: item.snippet || '',
      price: item.price ? {
        value: parseFloat(item.price.toString().replace(/[^0-9.]/g, '')) || 0,
        currency: 'USD',
        isOnSale: false,
      } : undefined,
      rating: item.rating ? {
        score: parseFloat(item.rating) || 0,
        reviewCount: parseInt(item.reviews || '0', 10) || 0,
      } : undefined,
      imageUrl: item.thumbnail || undefined,
      availability: 'unknown',
      source: item.source || 'Google Shopping',
      metadata: {},
    }));

    return {
      items,
      searchInformation: {
        totalResults: data.search_information?.total_results || shoppingResults.length,
      },
    };
  }

  /**
   * Get mock shopping results for development without API keys
   */
  private getMockShoppingResults(searchTerm: string, limit: number): { items: ShoppingItem[]; searchInformation: { totalResults: number } } {
    const mockItems: ShoppingItem[] = [
      {
        id: generateId(),
        title: `Premium ${searchTerm} - Best Seller`,
        url: 'https://example.com/product-1',
        snippet: `High-quality ${searchTerm} with excellent customer reviews. Perfect for everyday use.`,
        price: {
          value: 49.99,
          currency: 'USD',
          isOnSale: false,
        },
        rating: {
          score: 4.5,
          reviewCount: 1250,
        },
        imageUrl: 'https://example.com/image-1.jpg',
        availability: 'in_stock',
        source: 'Example Store',
        metadata: {
          category: 'general',
          brand: 'QualityBrand',
          isSponsored: false,
        },
      },
      {
        id: generateId(),
        title: `Classic ${searchTerm} - Great Value`,
        url: 'https://example.com/product-2',
        snippet: `Affordable ${searchTerm} that doesn't compromise on quality. Great for gifts.`,
        price: {
          value: 29.99,
          currency: 'USD',
          isOnSale: true,
          originalPrice: 39.99,
        },
        rating: {
          score: 4.2,
          reviewCount: 856,
        },
        imageUrl: 'https://example.com/image-2.jpg',
        availability: 'in_stock',
        source: 'Value Shop',
        metadata: {
          category: 'general',
          brand: 'ValueBrand',
          isSponsored: true,
        },
      },
      {
        id: generateId(),
        title: `Deluxe ${searchTerm} - Premium Edition`,
        url: 'https://example.com/product-3',
        snippet: `The ultimate ${searchTerm} experience. Features premium materials and advanced functionality.`,
        price: {
          value: 89.99,
          currency: 'USD',
          isOnSale: false,
        },
        rating: {
          score: 4.8,
          reviewCount: 423,
        },
        imageUrl: 'https://example.com/image-3.jpg',
        availability: 'in_stock',
        source: 'Luxury Goods',
        metadata: {
          category: 'premium',
          brand: 'LuxuryBrand',
          isSponsored: false,
        },
      },
      {
        id: generateId(),
        title: `Budget ${searchTerm} - Essential`,
        url: 'https://example.com/product-4',
        snippet: `Simple and straightforward ${searchTerm} for basic needs. Reliable and affordable.`,
        price: {
          value: 19.99,
          currency: 'USD',
          isOnSale: false,
        },
        rating: {
          score: 3.9,
          reviewCount: 2100,
        },
        imageUrl: 'https://example.com/image-4.jpg',
        availability: 'in_stock',
        source: 'Budget Store',
        metadata: {
          category: 'budget',
          brand: 'BudgetBrand',
          isSponsored: false,
        },
      },
      {
        id: generateId(),
        title: `Eco-Friendly ${searchTerm} - Sustainable Choice`,
        url: 'https://example.com/product-5',
        snippet: `Environmentally conscious ${searchTerm} made from sustainable materials. Good for the planet.`,
        price: {
          value: 39.99,
          currency: 'USD',
          isOnSale: false,
        },
        rating: {
          score: 4.6,
          reviewCount: 567,
        },
        imageUrl: 'https://example.com/image-5.jpg',
        availability: 'limited',
        source: 'Green Market',
        metadata: {
          category: 'eco-friendly',
          brand: 'EcoBrand',
          isSponsored: false,
        },
      },
    ];

    return {
      items: mockItems.slice(0, limit),
      searchInformation: {
        totalResults: mockItems.length,
      },
    };
  }

  /**
   * Filter results by price range
   */
  private filterByPriceRange(items: ShoppingItem[], priceRange: { min?: number; max?: number }): ShoppingItem[] {
    return items.filter(item => {
      if (!item.price) return true; // Keep items without price info
      if (priceRange.min !== undefined && item.price.value < priceRange.min) return false;
      if (priceRange.max !== undefined && item.price.value > priceRange.max) return false;
      return true;
    });
  }

  /**
   * Filter results by category
   */
  private filterByCategory(items: ShoppingItem[], category: string): ShoppingItem[] {
    const lowerCategory = category.toLowerCase();
    return items.filter(item => {
      if (item.metadata?.category?.toLowerCase() === lowerCategory) return true;
      if (item.metadata?.brand?.toLowerCase() === lowerCategory) return true;
      if (item.title.toLowerCase().includes(lowerCategory)) return true;
      return false;
    });
  }

  /**
   * Sort results by specified criteria
   */
  private sortResults(items: ShoppingItem[], sortBy: 'price_asc' | 'price_desc' | 'rating' | 'newest'): ShoppingItem[] {
    const sorted = [...items];

    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => {
          const priceA = a.price?.value ?? Infinity;
          const priceB = b.price?.value ?? Infinity;
          return priceA - priceB;
        });

      case 'price_desc':
        return sorted.sort((a, b) => {
          const priceA = a.price?.value ?? 0;
          const priceB = b.price?.value ?? 0;
          return priceB - priceA;
        });

      case 'rating':
        return sorted.sort((a, b) => {
          const ratingA = a.rating?.score ?? 0;
          const ratingB = b.rating?.score ?? 0;
          return ratingB - ratingA;
        });

      case 'newest':
        // For mock data, we'll just reverse the order
        return sorted.reverse();

      default:
        return items;
    }
  }

  /**
   * Create a success response output
   */
  private createSuccessOutput(
    results: ShoppingItem[],
    metadata: ShoppingSearchMetadata
  ): ShoppingSearchOutput {
    return {
      success: true,
      results,
      metadata,
    };
  }

  /**
   * Create an error response output
   */
  private createErrorOutput(error: string, startTime: number): ShoppingSearchOutput {
    return {
      success: false,
      results: [],
      metadata: {
        query: '',
        enhancedQuery: '',
        totalResults: 0,
        returnedCount: 0,
        searchTimeMs: Date.now() - startTime,
        source: 'mock_data',
        timestamp: new Date().toISOString(),
      },
      error,
    };
  }
}

// Export a lazy-initialized singleton instance for use across the app
let _shoppingSearchService: ShoppingSearchService | null = null;

export function getShoppingSearchService(): ShoppingSearchService {
  if (!_shoppingSearchService) {
    _shoppingSearchService = new ShoppingSearchService(
      process.env.SERPAPI_API_KEY
    );
  }
  return _shoppingSearchService;
}

/**
 * Convenience function for LLM agents to search shopping items
 * This is the primary entry point for the shopping search tool
 *
 * @example
 * ```typescript
 * import { searchShoppingItems } from './shopping';
 *
 * const result = await searchShoppingItems({
 *   searchTerm: "lego toy",
 *   maxResults: 5,
 *   priceRange: { min: 10, max: 100 },
 *   category: "toys"
 * });
 *
 * if (result.success) {
 *   console.log(`Found ${result.metadata.totalResults} items`);
 *   result.results.forEach(item => {
 *     console.log(`${item.title} - $${item.price?.value}`);
 *   });
 * } else {
 *   console.error('Search failed:', result.error);
 * }
 * ```
 */
export async function searchShoppingItems(
  input: ShoppingSearchInput
): Promise<ShoppingSearchOutput> {
  return getShoppingSearchService().searchShoppingItems(input);
}
