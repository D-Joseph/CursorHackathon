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

// ============================================
// Prompt Processing Types (Zod for validation)
// ============================================

import { z } from 'zod';

// Prompt input schema
export const PromptRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  friendId: z.string().optional(),
  userId: z.string().optional(),
});

export type PromptRequest = z.infer<typeof PromptRequestSchema>;

// Timeline event data schema
export const TimelineEventDataSchema = z.object({
  type: z.enum(['birthday', 'anniversary', 'holiday', 'custom']),
  date: z.string().optional(),
  description: z.string(),
  isRecurring: z.boolean().default(false),
});

export type TimelineEventData = z.infer<typeof TimelineEventDataSchema>;

// Gift suggestion data schema
export const GiftSuggestionDataSchema = z.object({
  occasion: z.string().optional(),
  budget: z.number().optional(),
  preferences: z.array(z.string()).default([]),
  searchKeywords: z.array(z.string()).default([]),
});

export type GiftSuggestionData = z.infer<typeof GiftSuggestionDataSchema>;

// Proactive suggestion schema
export const ProactiveSuggestionSchema = z.object({
  type: z.enum(['reachout', 'gift_idea', 'occasion_reminder']),
  reason: z.string(),
  suggestedAction: z.string(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
});

export type ProactiveSuggestion = z.infer<typeof ProactiveSuggestionSchema>;

// Parsed prompt output schema
export const ParsedPromptSchema = z.object({
  intent: z.enum(['timeline', 'gift', 'reachout', 'mixed']),
  timelineEvents: z.array(TimelineEventDataSchema).default([]),
  giftSuggestions: z.array(GiftSuggestionDataSchema).default([]),
  proactiveSuggestions: z.array(ProactiveSuggestionSchema).default([]),
  rawText: z.string(),
});

export type ParsedPrompt = z.infer<typeof ParsedPromptSchema>;

// LLM Gift Suggestion schema (for AI service)
export const LLMGiftSuggestionSchema = z.object({
  giftName: z.string(),
  giftDescription: z.string(),
  estimatedPrice: z.string(),
  whyItsPerfect: z.string(),
  matchingPreferences: z.array(z.string()).default([]),
  searchKeywords: z.array(z.string()).default([]),
});

export type LLMGiftSuggestion = z.infer<typeof LLMGiftSuggestionSchema>;
