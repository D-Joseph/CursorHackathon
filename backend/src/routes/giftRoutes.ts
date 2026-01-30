import { Router, Request, Response } from 'express';
import { giftService, CreateSavedGiftInput, UpdateSavedGiftInput, PriceInfo } from '../services/giftService';

const router = Router();

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * GET /api/gifts
 * Get all saved gifts for a user
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId query parameter is required'
      } as ApiResponse<null>);
    }

    const gifts = giftService.getAllByUserId(userId);

    res.json({
      success: true,
      data: gifts,
      message: `Found ${gifts.length} saved gifts`
    } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Error getting gifts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve gifts'
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/gifts/friend/:friendId
 * Get all saved gifts for a specific friend
 */
router.get('/friend/:friendId', (req: Request, res: Response) => {
  try {
    const { friendId } = req.params;
    const gifts = giftService.getAllByFriendId(friendId);

    res.json({
      success: true,
      data: gifts,
      message: `Found ${gifts.length} saved gifts for friend`
    } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Error getting gifts for friend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve gifts'
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/gifts/:id
 * Get a single saved gift by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const gift = giftService.getSavedGiftById(id);

    if (!gift) {
      return res.status(404).json({
        success: false,
        error: 'Gift not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: gift
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error getting gift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve gift'
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/gifts
 * Create a new saved gift
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      friendId,
      userId,
      name,
      description,
      priceAmount,
      priceCurrency,
      purchaseUrl,
      imageUrl,
      occasion,
      notes,
      status
    } = req.body;

    if (!friendId || !userId || !name || !description || !priceAmount || !purchaseUrl) {
      return res.status(400).json({
        success: false,
        error: 'friendId, userId, name, description, priceAmount, and purchaseUrl are required'
      } as ApiResponse<null>);
    }

    const validStatuses = ['idea', 'purchased', 'wrapped', 'given', 'returned', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${validStatuses.join(', ')}`
      } as ApiResponse<null>);
    }

    const input: CreateSavedGiftInput = {
      friendId,
      userId,
      name,
      description,
      priceAmount,
      priceCurrency,
      purchaseUrl,
      imageUrl,
      occasion,
      notes,
      status
    };

    const gift = giftService.createSavedGift(input);

    res.status(201).json({
      success: true,
      data: gift,
      message: 'Gift saved successfully'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error creating gift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save gift'
    } as ApiResponse<null>);
  }
});

/**
 * PUT /api/gifts/:id
 * Update a saved gift
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      priceAmount,
      priceCurrency,
      purchaseUrl,
      imageUrl,
      givenAt,
      occasion,
      notes,
      status,
      userRating,
      recipientReaction
    } = req.body;

    const input: UpdateSavedGiftInput = {};
    if (name) input.name = name;
    if (description) input.description = description;
    if (priceAmount !== undefined) input.priceAmount = priceAmount;
    if (priceCurrency) input.priceCurrency = priceCurrency;
    if (purchaseUrl) input.purchaseUrl = purchaseUrl;
    if (imageUrl !== undefined) input.imageUrl = imageUrl;
    if (givenAt) input.givenAt = givenAt;
    if (occasion !== undefined) input.occasion = occasion;
    if (notes !== undefined) input.notes = notes;
    if (status) input.status = status;
    if (userRating !== undefined) input.userRating = userRating;
    if (recipientReaction !== undefined) input.recipientReaction = recipientReaction;

    const gift = giftService.updateSavedGift(id, input);

    if (!gift) {
      return res.status(404).json({
        success: false,
        error: 'Gift not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: gift,
      message: 'Gift updated successfully'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error updating gift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update gift'
    } as ApiResponse<null>);
  }
});

/**
 * DELETE /api/gifts/:id
 * Delete a saved gift
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = giftService.deleteSavedGift(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Gift not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      message: 'Gift deleted successfully'
    } as ApiResponse<null>);
  } catch (error) {
    console.error('Error deleting gift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete gift'
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/gifts/from-search
 * Save a gift from search results
 */
router.post('/from-search', (req: Request, res: Response) => {
  try {
    const { searchResultId, friendId, userId } = req.body;

    if (!searchResultId || !friendId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'searchResultId, friendId, and userId are required'
      } as ApiResponse<null>);
    }

    const gift = giftService.saveFromSearchResult(searchResultId, friendId, userId);

    if (!gift) {
      return res.status(404).json({
        success: false,
        error: 'Search result not found'
      } as ApiResponse<null>);
    }

    res.status(201).json({
      success: true,
      data: gift,
      message: 'Gift saved from search results'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error saving gift from search:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save gift from search results'
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/gifts/search-results
 * Create a new gift search result
 */
router.post('/search-results', (req: Request, res: Response) => {
  try {
    const {
      searchId,
      title,
      description,
      sourceUrl,
      sourceName,
      price,
      imageUrl,
      relevanceScore,
      matchReasons,
      categories,
      tags,
      inStock,
      shippingTime
    } = req.body;

    if (!searchId || !title || !description || !sourceUrl || !sourceName || !price || !price.amount) {
      return res.status(400).json({
        success: false,
        error: 'searchId, title, description, sourceUrl, sourceName, and price.amount are required'
      } as ApiResponse<null>);
    }

    const priceInfo: PriceInfo = {
      amount: price.amount,
      currency: price.currency || 'USD',
      isOnSale: price.isOnSale,
      originalAmount: price.originalAmount,
      discountPercentage: price.discountPercentage
    };

    const result = giftService.createSearchResult(searchId, title, description, sourceUrl, sourceName, priceInfo, {
      imageUrl,
      relevanceScore,
      matchReasons,
      categories,
      tags,
      inStock,
      shippingTime
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Search result created successfully'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error creating search result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create search result'
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/gifts/search-results/:searchId
 * Get all search results for a search ID
 */
router.get('/search-results/:searchId', (req: Request, res: Response) => {
  try {
    const { searchId } = req.params;
    const results = giftService.getSearchResultsBySearchId(searchId);

    res.json({
      success: true,
      data: results,
      message: `Found ${results.length} search results`
    } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Error getting search results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve search results'
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/gifts/search-results/:id/feedback
 * Add feedback to a search result
 */
router.post('/search-results/:id/feedback', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, liked, saved, notes } = req.body;

    const feedback = giftService.addFeedback(id, { rating, liked, saved, notes });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Search result not found'
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: feedback,
      message: 'Feedback added successfully'
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add feedback'
    } as ApiResponse<null>);
  }
});

export default router;
