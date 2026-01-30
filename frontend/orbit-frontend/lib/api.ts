/**
 * Base API utilities for communicating with the backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BackendFriend {
  id: string;
  userId: string;
  name: string;
  birthday: string;
  relationship: string;
  profileImageUrl?: string;
  likes: PreferenceCategory[];
  dislikes: PreferenceCategory[];
  notes: FriendNote[];
  importantDates: ImportantDate[];
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceCategory {
  id: string;
  friendId: string;
  name: string;
  items: RankedItem[];
  categoryType: "like" | "dislike";
}

export interface RankedItem {
  id: string;
  categoryId: string;
  name: string;
  tags: string[];
  rank: number;
  description?: string;
  source?: string;
}

export interface FriendNote {
  id: string;
  friendId: string;
  content: string;
  category: string;
  createdAt: string;
}

export interface ImportantDate {
  id: string;
  friendId: string;
  name: string;
  date: string;
  type: string;
  recurring: boolean;
  giftIdeas?: string[];
}

export interface BackendGift {
  id: string;
  searchResultId?: string;
  friendId: string;
  userId: string;
  name: string;
  description: string;
  price: PriceInfo;
  purchaseUrl: string;
  imageUrl?: string;
  givenAt?: string;
  occasion?: string;
  notes?: string;
  status: "idea" | "purchased" | "wrapped" | "given" | "returned" | "archived";
  userRating?: number;
  recipientReaction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceInfo {
  amount: number;
  currency: string;
  isOnSale?: boolean;
  originalAmount?: number;
  discountPercentage?: number;
}

/**
 * Base fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error ${response.status}`,
      };
    }

    // Backend already returns { success, data, error } format - pass through directly
    return data as ApiResponse<T>;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Check if backend is running and healthy
 */
export async function checkBackendHealth(): Promise<boolean> {
  const response = await fetchApi<{ status: string }>("/health");
  return response.success && response.data?.status === "ok";
}

/**
 * GET request helper
 */
export function get<T>(endpoint: string) {
  return fetchApi<T>(endpoint, { method: "GET" });
}

/**
 * POST request helper
 */
export function post<T>(endpoint: string, body: unknown) {
  return fetchApi<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * PUT request helper
 */
export function put<T>(endpoint: string, body: unknown) {
  return fetchApi<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request helper
 */
export function del<T>(endpoint: string) {
  return fetchApi<T>(endpoint, { method: "DELETE" });
}

export { API_BASE_URL };
