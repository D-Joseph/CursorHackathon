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
   * Uses real product catalog with actual store URLs and Unsplash images
   */
  private getMockShoppingResults(searchTerm: string, limit: number): { items: ShoppingItem[]; searchInformation: { totalResults: number } } {
    // Real product catalog with actual store URLs
    const productCatalog: ShoppingItem[] = [
      // Electronics
      {
        id: generateId(),
        title: 'Sony WH-1000XM5 Wireless Headphones',
        url: 'https://www.amazon.com/dp/B09XS7JWHH',
        snippet: 'Industry-leading noise cancellation, exceptional sound quality, 30-hour battery life.',
        price: { value: 349.99, currency: 'USD', isOnSale: true, originalPrice: 399.99 },
        rating: { score: 4.8, reviewCount: 34521 },
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        availability: 'in_stock',
        source: 'Amazon',
        metadata: { category: 'electronics', brand: 'Sony' },
      },
      {
        id: generateId(),
        title: 'Apple Watch Series 9',
        url: 'https://www.apple.com/shop/buy-watch/apple-watch',
        snippet: 'Advanced health features, always-on Retina display, powerful fitness tracking.',
        price: { value: 399.00, currency: 'USD' },
        rating: { score: 4.7, reviewCount: 45231 },
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
        availability: 'in_stock',
        source: 'Apple',
        metadata: { category: 'electronics', brand: 'Apple' },
      },
      // Cooking
      {
        id: generateId(),
        title: 'Lodge Cast Iron Skillet 12-Inch',
        url: 'https://www.amazon.com/dp/B00006JSUB',
        snippet: 'Pre-seasoned cast iron for perfect searing. Lasts for generations.',
        price: { value: 49.99, currency: 'USD', isOnSale: true, originalPrice: 79.99 },
        rating: { score: 4.7, reviewCount: 89234 },
        imageUrl: 'https://images.unsplash.com/photo-1585837146751-a44118595680?w=400&h=400&fit=crop',
        availability: 'in_stock',
        source: 'Amazon',
        metadata: { category: 'cooking', brand: 'Lodge' },
      },
      {
        id: generateId(),
        title: 'Instant Pot Duo Plus 6-Quart',
        url: 'https://www.target.com/p/instant-pot-duo-plus-6qt/-/A-75560570',
        snippet: '9-in-1 pressure cooker, slow cooker, rice cooker, steamer and more.',
        price: { value: 129.99, currency: 'USD', isOnSale: true, originalPrice: 149.99 },
        rating: { score: 4.8, reviewCount: 67234 },
        imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop',
        availability: 'in_stock',
        source: 'Target',
        metadata: { category: 'cooking', brand: 'Instant Pot' },
      },
      // Outdoor/Hiking
      {
        id: generateId(),
        title: 'Osprey Atmos AG 65 Backpack',
        url: 'https://www.rei.com/product/177573/osprey-atmos-ag-65-pack-mens',
        snippet: 'Anti-Gravity suspension for all-day comfort. Perfect for multi-day adventures.',
        price: { value: 289.95, currency: 'USD' },
        rating: { score: 4.9, reviewCount: 3421 },
        imageUrl: 'https://images.unsplash.com/photo-1622260614153-03223fb72052?w=400&h=400&fit=crop',
        availability: 'in_stock',
        source: 'REI',
        metadata: { category: 'hiking', brand: 'Osprey' },
      },
      {
        id: generateId(),
        title: 'Hydro Flask Water Bottle 32oz',
        url: 'https://www.hydroflask.com/32-oz-wide-mouth',
        snippet: 'Double-wall vacuum insulation keeps drinks cold 24 hours, hot 12 hours.',
        price: { value: 44.95, currency: 'USD' },
        rating: { score: 4.8, reviewCount: 23412 },
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop',
        availability: 'in_stock',
        source: 'Hydro Flask',
        metadata: { category: 'outdoor', brand: 'Hydro Flask' },
      },
      // Photography
      {
        id: generateId(),
        title: 'Peak Design Everyday Sling 6L',
        url: 'https://www.peakdesign.com/products/everyday-sling',
        snippet: 'Versatile camera bag with quick-access dividers. Perfect for mirrorless setups.',
        price: { value: 99.95, currency: 'USD' },
        rating: { score: 4.6, reviewCount: 5621 },
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop',
        availability: 'in_stock',
        source: 'Peak Design',
        metadata: { category: 'photography', brand: 'Peak Design' },
      },
      // Gaming
      {
        id: generateId(),
        title: 'Razer DeathAdder V3 Gaming Mouse',
        url: 'https://www.razer.com/gaming-mice/razer-deathadder-v3',
        snippet: 'Ultra-lightweight ergonomic design with 30K optical sensor.',
        price: { value: 89.99, currency: 'USD' },
        rating: { score: 4.7, reviewCount: 12453 },
        imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop',
        availability: 'in_stock',
        source: 'Razer',
        metadata: { category: 'gaming', brand: 'Razer' },
      },
      // Reading
      {
        id: generateId(),
        title: 'Kindle Paperwhite (16 GB)',
        url: 'https://www.amazon.com/dp/B08KTZ8249',
        snippet: 'Glare-free display, waterproof design, weeks of battery life.',
        price: { value: 139.99, currency: 'USD', isOnSale: true, originalPrice: 159.99 },
        rating: { score: 4.8, reviewCount: 123421 },
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop',
        availability: 'in_stock',
        source: 'Amazon',
        metadata: { category: 'reading', brand: 'Amazon' },
      },
      // Home & Lifestyle
      {
        id: generateId(),
        title: 'Yankee Candle Large Jar Collection',
        url: 'https://www.yankeecandle.com/collections/large-jar-candles',
        snippet: 'Premium soy-blend wax with 110-150 hours of burn time.',
        price: { value: 31.00, currency: 'USD', isOnSale: true, originalPrice: 44.00 },
        rating: { score: 4.6, reviewCount: 9823 },
        imageUrl: 'https://images.unsplash.com/photo-1602607434639-aef11c451290?w=400&h=400&fit=crop',
        availability: 'in_stock',
        source: 'Yankee Candle',
        metadata: { category: 'home', brand: 'Yankee Candle' },
      },
      // Fitness
      {
        id: generateId(),
        title: 'Lululemon Reversible Mat 5mm',
        url: 'https://shop.lululemon.com/p/yoga-mats/The-Reversible-Mat-5',
        snippet: 'Natural rubber base provides cushion and grip for any practice.',
        price: { value: 88.00, currency: 'USD' },
        rating: { score: 4.7, reviewCount: 4521 },
        imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop',
        availability: 'in_stock',
        source: 'Lululemon',
        metadata: { category: 'fitness', brand: 'Lululemon' },
      },
      // Gift Sets
      {
        id: generateId(),
        title: 'Gourmet Gift Basket Deluxe',
        url: 'https://www.harryanddavid.com/h/gift-baskets/deluxe-favorites',
        snippet: 'Curated selection of artisan cheeses, crackers, chocolates and more.',
        price: { value: 79.99, currency: 'USD' },
        rating: { score: 4.5, reviewCount: 8921 },
        imageUrl: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400&h=400&fit=crop',
        availability: 'in_stock',
        source: 'Harry & David',
        metadata: { category: 'gift', brand: 'Harry & David' },
      },
    ];

    // Filter and prioritize based on search term
    const lowerSearchTerm = searchTerm.toLowerCase();
    const scoredProducts = productCatalog.map(product => {
      let score = 0;
      const productText = `${product.title} ${product.snippet} ${product.metadata?.category || ''} ${product.metadata?.brand || ''}`.toLowerCase();

      // Exact category match
      if (product.metadata?.category && lowerSearchTerm.includes(product.metadata.category)) {
        score += 10;
      }

      // Title contains search term
      if (product.title.toLowerCase().includes(lowerSearchTerm)) {
        score += 5;
      }

      // Any word match
      const searchWords = lowerSearchTerm.split(/\s+/);
      for (const word of searchWords) {
        if (word.length > 2 && productText.includes(word)) {
          score += 2;
        }
      }

      // Base relevance for all products
      score += 1;

      return { product, score };
    });

    // Sort by score and return
    const sortedProducts = scoredProducts
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);

    return {
      items: sortedProducts.slice(0, limit),
      searchInformation: {
        totalResults: sortedProducts.length,
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
