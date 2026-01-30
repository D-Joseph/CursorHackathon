/**
 * Type definitions for Orbit Backend
 */

/**
 * Represents a person/contact in the relationship co-pilot
 */
export interface Person {
  id: string;
  name: string;
  relationship: string;
  interests: string[];
  birthdate?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a gift idea for a person
 */
export interface GiftIdea {
  id: string;
  personId: string;
  name: string;
  description: string;
  price?: number;
  url?: string;
  category: string;
  relevanceScore: number;
  source: 'web-search' | 'manual' | 'ai-generated';
  createdAt: Date;
}

/**
 * Represents a message draft for outreach
 */
export interface MessageDraft {
  id: string;
  personId: string;
  content: string;
  tone: 'casual' | 'warm' | 'formal' | 'humorous';
  occasion?: string;
  isApproved: boolean;
  createdAt: Date;
}

/**
 * Web search result structure
 */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore?: number;
}

/**
 * Search request parameters
 */
export interface SearchRequest {
  query: string;
  context?: {
    personInterests?: string[];
    pastGifts?: string[];
    occasion?: string;
    budget?: number;
  };
  filters?: {
    category?: string;
    maxPrice?: number;
    minRating?: number;
  };
  limit?: number;
}

/**
 * API Response structures
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Gift search response with analyzed results
 */
export interface GiftSearchResponse {
  query: string;
  totalResults: number;
  results: GiftIdea[];
  suggestedRefinements?: string[];
}
