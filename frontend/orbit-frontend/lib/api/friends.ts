/**
 * Friends API client
 * Handles CRUD operations for friends/people with the backend
 */

import {
  get,
  post,
  put,
  del,
  ApiResponse,
  BackendFriend,
  BackendGift,
} from "../api";

/**
 * Convert backend friend to frontend Person type
 */
export function backendFriendToPerson(
  friend: BackendFriend,
  gifts: BackendGift[] = []
) {
  // Extract interests from "likes" preference category
  const interests: string[] = [];
  const dislikes: string[] = [];

  friend.likes?.forEach((category) => {
    category.items?.forEach((item) => {
      if (!interests.includes(item.name)) {
        interests.push(item.name);
      }
    });
  });

  friend.dislikes?.forEach((category) => {
    category.items?.forEach((item) => {
      if (!dislikes.includes(item.name)) {
        dislikes.push(item.name);
      }
    });
  });

  // Extract holidays from important dates
  const holidays: string[] = [];
  friend.importantDates?.forEach((date) => {
    if (
      date.type !== "birthday" &&
      date.name &&
      !holidays.includes(date.name)
    ) {
      holidays.push(date.name);
    }
  });

  return {
    id: friend.id,
    name: friend.name,
    birthday: friend.birthday,
    relationship: mapRelationshipFromBackend(friend.relationship),
    holidays,
    interests,
    dislikes,
    chatHistory: [],
    giftSuggestions: [],
    savedGifts: gifts.map((gift) => backendGiftToSavedGift(gift)),
  };
}

/**
 * Convert frontend relationship to backend relationship
 */
function mapRelationshipToBackend(frontendRelationship: string): string {
  const familyRelationships = [
    "Parent",
    "Sibling",
    "Child",
    "Grandparent",
    "Aunt/Uncle",
    "Cousin",
  ];
  const partnerRelationships = ["Spouse", "Partner"];

  if (familyRelationships.includes(frontendRelationship)) {
    return "family";
  }
  if (partnerRelationships.includes(frontendRelationship)) {
    return "partner";
  }
  if (frontendRelationship === "Friend") {
    return "friend";
  }
  if (frontendRelationship === "Coworker") {
    return "colleague";
  }
  return "other";
}

/**
 * Convert backend relationship to frontend relationship
 */
function mapRelationshipFromBackend(backendRelationship: string): string {
  const relationshipMap: Record<string, string> = {
    family: "Family",
    partner: "Partner",
    friend: "Friend",
    colleague: "Coworker",
    mentor: "Other",
    other: "Other",
  };
  return relationshipMap[backendRelationship] || "Other";
}

/**
 * Convert frontend Person to backend friend create/update payload
 */
export function personToBackendFriendPayload(person: {
  name: string;
  birthday: string;
  relationship: string;
  holidays: string[];
  interests: string[];
  dislikes: string[];
}) {
  return {
    name: person.name,
    birthday: person.birthday,
    relationship: mapRelationshipToBackend(person.relationship),
    // Convert interests to "likes" preference category
    likes: person.interests.length > 0
      ? [
          {
            name: "Interests",
            categoryType: "like" as const,
            items: person.interests.map((name, index) => ({
              name,
              tags: [],
              rank: index + 1,
            })),
          },
        ]
      : [],
    // Convert dislikes to "dislikes" preference category
    dislikes: person.dislikes.length > 0
      ? [
          {
            name: "Dislikes",
            categoryType: "dislike" as const,
            items: person.dislikes.map((name, index) => ({
              name,
              tags: [],
              rank: index + 1,
            })),
          },
        ]
      : [],
    // Convert holidays to important dates
    importantDates: person.holidays.map((name, index) => ({
      name,
      date: new Date().toISOString(),
      type: "other" as const,
      recurring: true,
      giftIdeas: [],
    })),
  };
}

/**
 * Convert backend gift to frontend saved gift type
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
 * Convert frontend saved gift to backend gift payload
 */
export function savedGiftToBackendPayload(
  friendId: string,
  userId: string,
  gift: {
    name: string;
    description: string;
    price?: number;
    currency?: string;
    purchaseUrl?: string;
    imageUrl?: string;
    occasion?: string;
    notes?: string;
    status?: string;
  }
) {
  return {
    friendId,
    userId,
    name: gift.name,
    description: gift.description,
    price: {
      amount: gift.price || 0,
      currency: gift.currency || "USD",
    },
    purchaseUrl: gift.purchaseUrl || "",
    imageUrl: gift.imageUrl,
    occasion: gift.occasion,
    notes: gift.notes,
    status: (gift.status as "idea" | "purchased" | "wrapped" | "given" | "returned" | "archived") || "idea",
  };
}

/**
 * Get all friends (backend uses hardcoded default user)
 */
export async function getFriends() {
  const response = await get<BackendFriend[]>(`/api/friends`);
  return response;
}

/**
 * Get a single friend by ID
 */
export async function getFriend(id: string) {
  const response = await get<BackendFriend>(`/api/friends/${id}`);
  return response;
}

/**
 * Create a new friend (backend uses hardcoded default user)
 */
export async function createFriend(
  person: {
    name: string;
    birthday: string;
    relationship: string;
    holidays: string[];
    interests: string[];
    dislikes: string[];
  }
) {
  const payload = {
    ...personToBackendFriendPayload(person),
  };
  const response = await post<BackendFriend>("/api/friends", payload);
  return response;
}

/**
 * Update a friend
 */
export async function updateFriend(
  id: string,
  person: {
    name?: string;
    birthday?: string;
    relationship?: string;
    holidays?: string[];
    interests?: string[];
    dislikes?: string[];
  }
) {
  const payload = personToBackendFriendPayload(person as {
    name: string;
    birthday: string;
    relationship: string;
    holidays: string[];
    interests: string[];
    dislikes: string[];
  });
  const response = await put<BackendFriend>(`/api/friends/${id}`, payload);
  return response;
}

/**
 * Delete a friend
 */
export async function deleteFriend(id: string) {
  const response = await del<{ success: boolean }>(`/api/friends/${id}`);
  return response;
}

/**
 * Add a preference category to a friend
 */
export async function addPreferenceCategory(
  friendId: string,
  name: string,
  categoryType: "like" | "dislike"
) {
  const response = await post<{ success: boolean }>(
    `/api/friends/${friendId}/preferences`,
    { name, categoryType }
  );
  return response;
}

/**
 * Add a note to a friend
 */
export async function addNote(
  friendId: string,
  content: string,
  category: string = "general"
) {
  const response = await post<{ success: boolean }>(
    `/api/friends/${friendId}/notes`,
    { content, category }
  );
  return response;
}

/**
 * Add an important date to a friend
 */
export async function addImportantDate(
  friendId: string,
  name: string,
  date: string,
  type: string,
  recurring: boolean = true
) {
  const response = await post<{ success: boolean }>(
    `/api/friends/${friendId}/dates`,
    { name, date, type, recurring }
  );
  return response;
}

/**
 * Delete a note from a friend
 */
export async function deleteNote(friendId: string, noteId: string) {
  const response = await del<{ success: boolean }>(
    `/api/friends/${friendId}/notes/${noteId}`
  );
  return response;
}

/**
 * Delete an important date from a friend
 */
export async function deleteImportantDate(friendId: string, dateId: string) {
  const response = await del<{ success: boolean }>(
    `/api/friends/${friendId}/dates/${dateId}`
  );
  return response;
}
