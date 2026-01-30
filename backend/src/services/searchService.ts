import axios from 'axios';

/**
 * Web Search Service for finding gift ideas
 * Can be extended with different search providers (Google, Bing, etc.)
 */
export class SearchService {
  private apiKey?: string;
  private searchEngineId?: string;
  private baseUrl = 'https://www.googleapis.com/customsearch/v1';

  constructor(apiKey?: string, searchEngineId?: string) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
  }

  /**
   * Perform a web search with context-aware query enhancement
   */
  async search(request: any): Promise<any[]> {
    const enhancedQuery = this.enhanceQuery(request);

    try {
      if (this.apiKey && this.searchEngineId) {
        return await this.googleSearch(enhancedQuery, request.limit);
      } else {
        // Fallback to a simple search simulation for development
        return this.getMockSearchResults(enhancedQuery);
      }
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Failed to perform web search');
    }
  }

  /**
   * Enhance the search query with context from the person
   */
  private enhanceQuery(request: any): string {
    const { query, context } = request;
    let enhancedQuery = query;

    if (context?.personInterests?.length) {
      const interests = context.personInterests.join(', ');
      enhancedQuery += ` for someone interested in ${interests}`;
    }

    if (context?.occasion) {
      enhancedQuery += ` ${context.occasion}`;
    }

    if (context?.budget) {
      enhancedQuery += ` under $${context.budget}`;
    }

    return enhancedQuery;
  }

  /**
   * Perform Google Custom Search
   */
  private async googleSearch(query: string, limit = 10): Promise<any[]> {
    const response = await axios.get(this.baseUrl, {
      params: {
        key: this.apiKey,
        cx: this.searchEngineId,
        q: query,
        num: limit,
      },
    });

    return response.data.items?.map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      relevanceScore: item.score,
    })) || [];
  }

  /**
   * Mock search results for development without API keys
   */
  private getMockSearchResults(query: string): any[] {
    // Return mock results based on query keywords
    const mockResults: any[] = [
      {
        title: `Best ${query} Gift Ideas - Curated Collection`,
        url: 'https://example.com/gifts',
        snippet: `Discover amazing ${query} gift ideas that your loved one will cherish. Handpicked selections for every occasion.`,
        relevanceScore: 0.95,
      },
      {
        title: `Top 10 ${query} Gifts for 2024`,
        url: 'https://example.com/top-gifts',
        snippet: `Our expert-picked selection of the best ${query} gifts this year. Find the perfect gift for your special someone.`,
        relevanceScore: 0.89,
      },
      {
        title: `Unique ${query} Gift Ideas They'll Love`,
        url: 'https://example.com/unique',
        snippet: `Looking for something special? These unique ${query} gift ideas are sure to impress.`,
        relevanceScore: 0.82,
      },
      {
        title: `Budget-Friendly ${query} Gift Options`,
        url: 'https://example.com/budget',
        snippet: `Great gifts don't have to break the bank. Check out these affordable ${query} options.`,
        relevanceScore: 0.78,
      },
    ];

    return mockResults;
  }

  /**
   * Convert search results to gift ideas
   */
  searchResultsToGiftIdeas(results: any[], personId: string): any[] {
    return results.map((result, index) => ({
      id: `gift-${Date.now()}-${index}`,
      personId,
      name: result.title.replace(/^(Best |Top |Unique )/i, '').slice(0, 100),
      description: result.snippet,
      url: result.url,
      category: this.categorizeGift(result.title + ' ' + result.snippet),
      relevanceScore: result.relevanceScore || 0.5,
      source: 'web-search' as const,
      createdAt: new Date(),
    }));
  }

  /**
   * Categorize a gift based on its content
   */
  private categorizeGift(content: string): string {
    const categories = {
      'Tech & Gadgets': ['tech', 'gadget', 'electronic', 'smart', 'device'],
      'Books & Media': ['book', 'ebook', 'audiobook', 'reading', 'novel'],
      'Home & Living': ['home', 'kitchen', 'decor', 'furniture', 'living'],
      'Fashion & Accessories': ['fashion', 'clothing', 'wear', 'accessory', 'jewelry'],
      'Food & Drinks': ['food', 'cooking', 'recipe', 'drink', 'gourmet', 'snack'],
      'Experiences': ['experience', 'adventure', 'travel', 'tour', 'workshop'],
      'Health & Wellness': ['health', 'fitness', 'wellness', 'self-care', 'spa'],
      'Art & Creative': ['art', 'craft', 'creative', 'diy', 'handmade'],
    };

    const lowerContent = content.toLowerCase();

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }
}

// Export a singleton instance for use across the app
export const searchService = new SearchService(
  process.env.GOOGLE_API_KEY,
  process.env.GOOGLE_SEARCH_ENGINE_ID
);
