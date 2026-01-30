import db from '../database/config';
import { v4 as uuidv4 } from 'uuid';

// Types based on data/types.ts
export interface GiftSearchResult {
  id: string;
  searchId: string;
  title: string;
  description: string;
  sourceUrl: string;
  sourceName: string;
  price: PriceInfo;
  imageUrl?: string;
  relevanceScore: number;
  matchReasons: string[];
  categories: string[];
  tags: string[];
  inStock: boolean;
  shippingTime?: string;
  userFeedback?: GiftUserFeedback;
}

export interface PriceInfo {
  amount: number;
  currency: string;
  isOnSale?: boolean;
  originalAmount?: number;
  discountPercentage?: number;
}

export interface GiftUserFeedback {
  rating?: number;
  liked: boolean;
  saved: boolean;
  notes?: string;
}

export interface SavedGift {
  id: string;
  searchResultId?: string;
  friendId: string;
  userId: string;
  name: string;
  description: string;
  price: PriceInfo;
  purchaseUrl: string;
  imageUrl?: string;
  givenAt?: Date;
  occasion?: string;
  notes?: string;
  status: GiftStatus;
  userRating?: number;
  recipientReaction?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type GiftStatus = 'idea' | 'purchased' | 'wrapped' | 'given' | 'returned' | 'archived';

export interface GiftTimeline {
  id: string;
  friendId: string;
  events: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  type: 'gift_given' | 'gift_saved' | 'gift_idea' | 'occasion_celebrated' | 'search_performed';
  date: Date;
  gift?: SavedGift;
  occasion?: string;
  notes?: string;
  photos?: string[];
}

export interface CreateSavedGiftInput {
  friendId: string;
  userId: string;
  name: string;
  description: string;
  priceAmount: number;
  priceCurrency?: string;
  purchaseUrl: string;
  imageUrl?: string;
  occasion?: string;
  notes?: string;
  status?: GiftStatus;
}

export interface UpdateSavedGiftInput {
  name?: string;
  description?: string;
  priceAmount?: number;
  priceCurrency?: string;
  purchaseUrl?: string;
  imageUrl?: string;
  givenAt?: string;
  occasion?: string;
  notes?: string;
  status?: GiftStatus;
  userRating?: number;
  recipientReaction?: string;
}

/**
 * Gift Service - CRUD operations for gifts and search results
 */
export class GiftService {
  /**
   * Get all saved gifts for a user
   */
  getAllByUserId(userId: string): SavedGift[] {
    const gifts = db.prepare(`
      SELECT * FROM saved_gifts WHERE userId = ? ORDER BY createdAt DESC
    `).all(userId) as any[];

    return gifts.map(gift => this.buildSavedGift(gift));
  }

  /**
   * Get all saved gifts for a friend
   */
  getAllByFriendId(friendId: string): SavedGift[] {
    const gifts = db.prepare(`
      SELECT * FROM saved_gifts WHERE friendId = ? ORDER BY createdAt DESC
    `).all(friendId) as any[];

    return gifts.map(gift => this.buildSavedGift(gift));
  }

  /**
   * Get a single saved gift by ID
   */
  getSavedGiftById(id: string): SavedGift | null {
    const gift = db.prepare(`
      SELECT * FROM saved_gifts WHERE id = ?
    `).get(id) as any;

    if (!gift) return null;

    return this.buildSavedGift(gift);
  }

  /**
   * Create a new saved gift
   */
  createSavedGift(input: CreateSavedGiftInput): SavedGift {
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO saved_gifts (
        id, searchResultId, friendId, userId, name, description,
        priceAmount, priceCurrency, purchaseUrl, imageUrl,
        occasion, notes, status, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      null,
      input.friendId,
      input.userId,
      input.name,
      input.description,
      input.priceAmount,
      input.priceCurrency || 'USD',
      input.purchaseUrl,
      input.imageUrl || null,
      input.occasion || null,
      input.notes || null,
      input.status || 'idea',
      now,
      now
    );

    return this.getSavedGiftById(id)!;
  }

  /**
   * Update a saved gift
   */
  updateSavedGift(id: string, input: UpdateSavedGiftInput): SavedGift | null {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.description) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.priceAmount !== undefined) {
      updates.push('priceAmount = ?');
      values.push(input.priceAmount);
    }
    if (input.priceCurrency) {
      updates.push('priceCurrency = ?');
      values.push(input.priceCurrency);
    }
    if (input.purchaseUrl) {
      updates.push('purchaseUrl = ?');
      values.push(input.purchaseUrl);
    }
    if (input.imageUrl !== undefined) {
      updates.push('imageUrl = ?');
      values.push(input.imageUrl);
    }
    if (input.givenAt) {
      updates.push('givenAt = ?');
      values.push(input.givenAt);
    }
    if (input.occasion !== undefined) {
      updates.push('occasion = ?');
      values.push(input.occasion);
    }
    if (input.notes !== undefined) {
      updates.push('notes = ?');
      values.push(input.notes);
    }
    if (input.status) {
      updates.push('status = ?');
      values.push(input.status);
    }
    if (input.userRating !== undefined) {
      updates.push('userRating = ?');
      values.push(input.userRating);
    }
    if (input.recipientReaction !== undefined) {
      updates.push('recipientReaction = ?');
      values.push(input.recipientReaction);
    }

    if (updates.length === 0) return this.getSavedGiftById(id);

    updates.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);

    db.prepare(`
      UPDATE saved_gifts SET ${updates.join(', ')} WHERE id = ?
    `).run(...values);

    return this.getSavedGiftById(id);
  }

  /**
   * Delete a saved gift
   */
  deleteSavedGift(id: string): boolean {
    const result = db.prepare(`DELETE FROM saved_gifts WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  /**
   * Save a gift from search results
   */
  saveFromSearchResult(
    searchResultId: string,
    friendId: string,
    userId: string
  ): SavedGift | null {
    const searchResult = db.prepare(`
      SELECT * FROM gift_search_results WHERE id = ?
    `).get(searchResultId) as any;

    if (!searchResult) return null;

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO saved_gifts (
        id, searchResultId, friendId, userId, name, description,
        priceAmount, priceCurrency, purchaseUrl, imageUrl,
        status, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      searchResultId,
      friendId,
      userId,
      searchResult.title,
      searchResult.description,
      searchResult.priceAmount,
      searchResult.priceCurrency,
      searchResult.sourceUrl,
      searchResult.imageUrl || null,
      'idea',
      now,
      now
    );

    return this.getSavedGiftById(id)!;
  }

  /**
   * Create a gift search result
   */
  createSearchResult(
    searchId: string,
    title: string,
    description: string,
    sourceUrl: string,
    sourceName: string,
    price: PriceInfo,
    options?: {
      imageUrl?: string;
      relevanceScore?: number;
      matchReasons?: string[];
      categories?: string[];
      tags?: string[];
      inStock?: boolean;
      shippingTime?: string;
    }
  ): GiftSearchResult {
    const id = uuidv4();

    db.prepare(`
      INSERT INTO gift_search_results (
        id, searchId, title, description, sourceUrl, sourceName,
        priceAmount, priceCurrency, isOnSale, originalAmount, discountPercentage,
        imageUrl, relevanceScore, matchReasons, categories, tags, inStock, shippingTime
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      searchId,
      title,
      description,
      sourceUrl,
      sourceName,
      price.amount,
      price.currency,
      price.isOnSale ? 1 : 0,
      price.originalAmount || null,
      price.discountPercentage || null,
      options?.imageUrl || null,
      options?.relevanceScore || 0,
      JSON.stringify(options?.matchReasons || []),
      JSON.stringify(options?.categories || []),
      JSON.stringify(options?.tags || []),
      options?.inStock !== false ? 1 : 0,
      options?.shippingTime || null
    );

    return this.getSearchResultById(id)!;
  }

  /**
   * Get a search result by ID
   */
  getSearchResultById(id: string): GiftSearchResult | null {
    const result = db.prepare(`
      SELECT * FROM gift_search_results WHERE id = ?
    `).get(id) as any;

    if (!result) return null;

    return this.buildSearchResult(result);
  }

  /**
   * Get all search results for a search ID
   */
  getSearchResultsBySearchId(searchId: string): GiftSearchResult[] {
    const results = db.prepare(`
      SELECT * FROM gift_search_results WHERE searchId = ? ORDER BY relevanceScore DESC
    `).all(searchId) as any[];

    return results.map(r => this.buildSearchResult(r));
  }

  /**
   * Add feedback to a search result
   */
  addFeedback(
    giftId: string,
    feedback: Partial<GiftUserFeedback>
  ): GiftUserFeedback | null {
    const existing = db.prepare(`
      SELECT * FROM gift_user_feedback WHERE giftId = ?
    `).get(giftId) as any;

    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE gift_user_feedback
        SET rating = COALESCE(?, rating),
            liked = COALESCE(?, liked),
            saved = COALESCE(?, saved),
            notes = COALESCE(?, notes),
            updatedAt = ?
        WHERE giftId = ?
      `).run(
        feedback.rating ?? null,
        feedback.liked ? 1 : 0,
        feedback.saved ? 1 : 0,
        feedback.notes || null,
        now,
        giftId
      );
    } else {
      const id = uuidv4();
      db.prepare(`
        INSERT INTO gift_user_feedback (id, giftId, rating, liked, saved, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        giftId,
        feedback.rating ?? null,
        feedback.liked ? 1 : 0,
        feedback.saved ? 1 : 0,
        feedback.notes || null,
        now,
        now
      );
    }

    return this.getFeedbackByGiftId(giftId);
  }

  /**
   * Get feedback for a gift
   */
  getFeedbackByGiftId(giftId: string): GiftUserFeedback | null {
    const feedback = db.prepare(`
      SELECT * FROM gift_user_feedback WHERE giftId = ?
    `).get(giftId) as any;

    if (!feedback) return null;

    return {
      rating: feedback.rating || undefined,
      liked: Boolean(feedback.liked),
      saved: Boolean(feedback.saved),
      notes: feedback.notes || undefined
    };
  }

  /**
   * Build a complete SavedGift object
   */
  private buildSavedGift(gift: any): SavedGift {
    return {
      id: gift.id,
      searchResultId: gift.searchResultId || undefined,
      friendId: gift.friendId,
      userId: gift.userId,
      name: gift.name,
      description: gift.description,
      price: {
        amount: gift.priceAmount,
        currency: gift.priceCurrency
      },
      purchaseUrl: gift.purchaseUrl,
      imageUrl: gift.imageUrl || undefined,
      givenAt: gift.givenAt ? new Date(gift.givenAt) : undefined,
      occasion: gift.occasion || undefined,
      notes: gift.notes || undefined,
      status: gift.status as GiftStatus,
      userRating: gift.userRating || undefined,
      recipientReaction: gift.recipientReaction || undefined,
      createdAt: new Date(gift.createdAt),
      updatedAt: new Date(gift.updatedAt)
    };
  }

  /**
   * Build a complete GiftSearchResult object
   */
  private buildSearchResult(result: any): GiftSearchResult {
    return {
      id: result.id,
      searchId: result.searchId,
      title: result.title,
      description: result.description,
      sourceUrl: result.sourceUrl,
      sourceName: result.sourceName,
      price: {
        amount: result.priceAmount,
        currency: result.priceCurrency,
        isOnSale: Boolean(result.isOnSale),
        originalAmount: result.originalAmount || undefined,
        discountPercentage: result.discountPercentage || undefined
      },
      imageUrl: result.imageUrl || undefined,
      relevanceScore: result.relevanceScore,
      matchReasons: JSON.parse(result.matchReasons || '[]'),
      categories: JSON.parse(result.categories || '[]'),
      tags: JSON.parse(result.tags || '[]'),
      inStock: Boolean(result.inStock),
      shippingTime: result.shippingTime || undefined,
      userFeedback: this.getFeedbackByGiftId(result.id) || undefined
    };
  }
}

// Export singleton instance
export const giftService = new GiftService();
