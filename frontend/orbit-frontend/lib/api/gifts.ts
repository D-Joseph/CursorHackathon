/**
 * Gifts API client
 * Handles CRUD operations for saved gifts with the backend
 */

import {
  get,
  post,
  put,
  del,
  ApiResponse,
  BackendGift,
  PriceInfo,
} from "../api";

/**
 * Convert backend gift to frontend saved gift format
 */
export function backendGiftToSavedGift(gift: BackendGift) {
  return {
    id: gift.id,
    name: gift.name,
    description: gift.description,
    price: gift.price,
    purchaseUrl: gift.purchaseUrl,
    imageUrl: gift.imageUrl,
    status: gift.status,
    occasion: gift.occasion,
    notes: gift.notes,
    createdAt: new Date(gift.createdAt),
  };
}

/**
 * Get all gifts for a friend (backend uses hardcoded default user)
 */
export async function getGiftsByFriend(friendId: string) {
  const response = await get<BackendGift[]>(`/api/gifts/friend/${friendId}`);
  return response;
}

/**
 * Get all gifts (backend uses hardcoded default user)
 */
export async function getAllGifts() {
  const response = await get<BackendGift[]>(`/api/gifts`);
  return response;
}

/**
 * Get a single gift by ID
 */
export async function getGift(id: string) {
  const response = await get<BackendGift>(`/api/gifts/${id}`);
  return response;
}

/**
 * Create a new saved gift (backend uses hardcoded default user)
 */
export async function createGift(gift: {
  friendId: string;
  name: string;
  description: string;
  price?: PriceInfo;
  purchaseUrl?: string;
  imageUrl?: string;
  occasion?: string;
  notes?: string;
  status?: "idea" | "purchased" | "wrapped" | "given" | "returned" | "archived";
}) {
  // Backend expects flat priceAmount/priceCurrency fields, not a nested price object
  const payload = {
    friendId: gift.friendId,
    name: gift.name,
    description: gift.description,
    priceAmount: gift.price?.amount || 0,
    priceCurrency: gift.price?.currency || "USD",
    purchaseUrl: gift.purchaseUrl || "",
    imageUrl: gift.imageUrl,
    occasion: gift.occasion,
    notes: gift.notes,
    status: gift.status || "idea",
  };

  const response = await post<BackendGift>("/api/gifts", payload);
  return response;
}

/**
 * Update a saved gift
 */
export async function updateGift(
  id: string,
  gift: Partial<{
    name: string;
    description: string;
    price: PriceInfo;
    purchaseUrl: string;
    imageUrl: string;
    occasion: string;
    notes: string;
    status: "idea" | "purchased" | "wrapped" | "given" | "returned" | "archived";
    userRating: number;
    recipientReaction: string;
  }>
) {
  const response = await put<BackendGift>(`/api/gifts/${id}`, gift);
  return response;
}

/**
 * Delete a saved gift
 */
export async function deleteGift(id: string) {
  const response = await del<{ success: boolean }>(`/api/gifts/${id}`);
  return response;
}

/**
 * Save a gift from search results (backend uses hardcoded default user)
 */
export async function saveFromSearchResult(
  searchResultId: string,
  friendId: string
) {
  const response = await post<BackendGift>("/api/gifts/from-search", {
    searchResultId,
    friendId,
  });
  return response;
}

/**
 * Create a gift search result
 */
export async function createSearchResult(data: {
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
}) {
  const response = await post<BackendGift>("/api/gifts/search-results", data);
  return response;
}

/**
 * Get search results by search ID
 */
export async function getSearchResults(searchId: string) {
  const response = await get<BackendGift[]>(
    `/api/gifts/search-results/${searchId}`
  );
  return response;
}

/**
 * Add feedback to a search result
 */
export async function addFeedback(
  giftId: string,
  feedback: {
    rating?: number;
    liked: boolean;
    saved: boolean;
    notes?: string;
  }
) {
  const response = await post<{ success: boolean }>(
    `/api/gifts/search-results/${giftId}/feedback`,
    feedback
  );
  return response;
}
