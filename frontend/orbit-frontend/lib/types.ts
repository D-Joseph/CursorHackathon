export interface SavedGift {
  id: string;
  name: string;
  description: string;
  price: {
    amount: number;
    currency: string;
    isOnSale?: boolean;
    originalAmount?: number;
    discountPercentage?: number;
  };
  purchaseUrl: string;
  imageUrl?: string;
  status: "idea" | "purchased" | "wrapped" | "given" | "returned" | "archived";
  occasion?: string;
  notes?: string;
  createdAt: Date;
}

export interface Person {
  id: string;
  name: string;
  birthday: string;
  relationship: string;
  holidays: string[];
  interests: string[];
  dislikes: string[];
  chatHistory: ChatMessage[];
  giftSuggestions: string[];
  savedGifts?: SavedGift[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const HOLIDAYS = [
  "Christmas",
  "Hanukkah",
  "New Year",
  "Birthday",
  "Valentine's Day",
  "Easter",
  "Mother's Day",
  "Father's Day",
  "Thanksgiving",
  "Diwali",
  "Eid",
  "Anniversary",
] as const;

export const RELATIONSHIPS = [
  "Parent",
  "Sibling",
  "Child",
  "Spouse",
  "Partner",
  "Friend",
  "Grandparent",
  "Aunt/Uncle",
  "Cousin",
  "Coworker",
  "Neighbor",
  "Other",
] as const;

export type Holiday = (typeof HOLIDAYS)[number];
export type Relationship = (typeof RELATIONSHIPS)[number];
