import { Router, Request, Response } from 'express';
import { searchService } from '../services/searchService';

const router = Router();

/**
 * POST /api/search/gifts
 * Search for gift ideas with context awareness
 */
router.post('/gifts', async (req: Request, res: Response) => {
  try {
    const searchRequest: any = req.body;

    // Validate required fields
    if (!searchRequest.query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    // Perform the search
    const searchResults = await searchService.search(searchRequest);

    // Convert to gift ideas
    const personId = searchRequest.context?.personInterests?.join(',') || 'unknown';
    const giftIdeas = searchService.searchResultsToGiftIdeas(searchResults, personId);

    // Filter by price if specified
    let filteredGifts = giftIdeas;
    if (searchRequest.filters?.maxPrice) {
      filteredGifts = giftIdeas.filter((gift: any) =>
        !gift.price || gift.price <= searchRequest.filters!.maxPrice!
      );
    }

    // Limit results
    if (searchRequest.limit) {
      filteredGifts = filteredGifts.slice(0, searchRequest.limit);
    }

    const response = {
      success: true,
      data: {
        query: searchRequest.query,
        totalResults: filteredGifts.length,
        results: filteredGifts,
        suggestedRefinements: generateRefinements(searchRequest),
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Gift search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search for gift ideas',
    });
  }
});

/**
 * POST /api/search/web
 * General web search endpoint
 */
router.post('/web', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    const searchRequest: any = { query, limit };
    const results = await searchService.search(searchRequest);

    res.json({
      success: true,
      data: {
        query,
        totalResults: results.length,
        results,
      },
    });
  } catch (error) {
    console.error('Web search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform web search',
    });
  }
});

/**
 * Generate suggested refinements based on the search context
 */
function generateRefinements(request: any): string[] {
  const refinements: string[] = [];

  if (!request.context?.budget) {
    refinements.push('Add a budget to filter results');
  }

  if (!request.context?.occasion) {
    refinements.push('Specify the occasion for better suggestions');
  }

  if (!request.context?.personInterests?.length) {
    refinements.push('Add the person\'s interests for personalized results');
  }

  refinements.push('Try searching for specific brands or stores');
  refinements.push('Consider experiences in addition to physical gifts');

  return refinements;
}

export default router;
