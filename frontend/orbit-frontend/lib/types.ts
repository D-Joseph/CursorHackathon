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
