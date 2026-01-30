// ============================================
// Gift Giving Platform Types
// ============================================

// Core user/friend profile types
export interface Friend {
  id: string;
  name: string;
  birthday: Date;
  relationship: RelationshipType;
  profileImageUrl?: string;

  // Preferences
  likes: PreferenceCategory[];
  dislikes: PreferenceCategory[];
  notes: FriendNote[];

  // Occasions to remember
  importantDates: ImportantDate[];

  createdAt: Date;
  updatedAt: Date;
}

export type RelationshipType =
  | 'family'
  | 'partner'
  | 'friend'
  | 'colleague'
  | 'mentor'
  | 'other';

// Preference categories with ranked items
export interface PreferenceCategory {
  id: string;
  name: string;
  items: RankedItem[];
  categoryType: 'like' | 'dislike';
}

export interface RankedItem {
  id: string;
  name: string;
  tags: string[];
  rank: number; // Priority rank (higher = more important)
  description?: string;
  source?: string; // Where this info came from
}

// Additional notes about the friend
export interface FriendNote {
  id: string;
  content: string;
  category: NoteCategory;
  createdAt: Date;
}

export type NoteCategory =
  | 'general'
  | 'hobbies'
  | 'style'
  | 'lifestyle'
  | 'wishlist'
  | 'conversations'
  | 'other';

// Important dates for gift occasions
export interface ImportantDate {
  id: string;
  name: string;
  date: Date;
  type: DateType;
  recurring: boolean;
  giftIdeas?: string[];
}

export type DateType =
  | 'birthday'
  | 'anniversary'
  | 'holiday'
  | 'graduation'
  | 'wedding'
  | 'christmas'
  | 'other'
  | 'custom';

// ============================================
// Gift Search & Discovery Types
// ============================================

export interface GiftSearchRequest {
  friendId: string;
  occasion?: GiftOccasion;
  budgetRange?: BudgetRange;
  searchQuery: string;
  preferences: string[];
  constraints?: string[];
}

export type GiftOccasion =
  | 'birthday'
  | 'christmas'
  | 'anniversary'
  | 'graduation'
  | 'thank_you'
  | 'just_because'
  | 'other';

export interface BudgetRange {
  min: number;
  max: number;
  currency: string;
}

// Result from LLM + web search
export interface GiftSearchResult {
  id: string;
  searchId: string;
  title: string;
  description: string;

  // Source info
  sourceUrl: string;
  sourceName: string; // e.g., "Amazon", "Etsy", "Specialty Store"
  price: PriceInfo;
  imageUrl?: string;

  // Relevance scoring
  relevanceScore: number; // 0-100 from LLM analysis
  matchReasons: string[]; // Why this matches the friend's preferences

  // Categorization
  categories: string[];
  tags: string[];

  // Availability
  inStock: boolean;
  shippingTime?: string;

  // User interaction
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
  rating?: number; // 1-5 star rating
  liked: boolean;
  saved: boolean;
  notes?: string;
}

// ============================================
// Carousel Display Types
// ============================================

export interface GiftCarouselState {
  searchId: string;
  currentIndex: number;
  gifts: GiftCarouselItem[];
  filters: CarouselFilters;
  sortBy: CarouselSortOption;
}

export interface GiftCarouselItem {
  gift: GiftSearchResult;
  isFavorite: boolean;
  isHidden: boolean;
  previewReason?: string; // Short reason why this gift is recommended
}

export interface CarouselFilters {
  priceRange?: BudgetRange;
  categories?: string[];
  inStockOnly: boolean;
  maxResults?: number;
}

export type CarouselSortOption =
  | 'relevance'
  | 'price_low'
  | 'price_high'
  | 'rating'
  | 'newest';

// ============================================
// Timeline & Saved Gifts Types
// ============================================

export interface GiftTimeline {
  id: string;
  friendId: string;
  events: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  type: EventType;
  date: Date;
  gift?: SavedGift;
  occasion?: GiftOccasion;
  notes?: string;
  photos?: string[];
}

export type EventType =
  | 'gift_given'
  | 'gift_saved'
  | 'gift_idea'
  | 'occasion_celebrated'
  | 'search_performed';

export interface SavedGift {
  id: string;
  searchResultId: string;

  // Gift details
  name: string;
  description: string;
  price: PriceInfo;
  purchaseUrl: string;
  imageUrl?: string;

  // When it was given
  givenAt?: Date;
  occasion?: GiftOccasion;
  notes?: string;

  // Status
  status: GiftStatus;
  userRating?: number;
  recipientReaction?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type GiftStatus =
  | 'idea'
  | 'purchased'
  | 'wrapped'
  | 'given'
  | 'returned'
  | 'archived';

// ============================================
// LLM & Web Search Integration Types
// ============================================

export interface LLMGiftSuggestion {
  giftName: string;
  giftDescription: string;
  estimatedPrice: string;
  whyItsPerfect: string;
  matchingPreferences: string[];
  searchKeywords: string[];
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  price?: string;
  rating?: number;
  imageUrl?: string;
}

// ============================================
// API/State Management Types
// ============================================

export interface AppState {
  currentUser: User | null;
  friends: Friend[];
  selectedFriendId: string | null;
  giftSearch: GiftSearchState;
  timeline: GiftTimeline | null;
}

export interface GiftSearchState {
  isLoading: boolean;
  searchId: string | null;
  results: GiftSearchResult[];
  error: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}