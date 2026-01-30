"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Person, ChatMessage, SavedGift } from "./types";
import * as friendsApi from "./api/friends";
import * as giftsApi from "./api/gifts";

interface GiftStore {
  // State
  people: Person[];
  selectedPersonId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  addPerson: (person: Omit<Person, "id" | "chatHistory" | "giftSuggestions" | "savedGifts">) => Promise<void>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  selectPerson: (id: string | null) => void;
  addChatMessage: (personId: string, message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateInterests: (personId: string, interests: string[]) => void;
  updateDislikes: (personId: string, dislikes: string[]) => void;
  setGiftSuggestions: (personId: string, suggestions: string[]) => void;

  // Backend sync actions
  loadFromBackend: () => Promise<void>;
  savePersonToBackend: (person: Omit<Person, "id" | "chatHistory" | "giftSuggestions" | "savedGifts">) => Promise<string>;
  updatePersonInBackend: (id: string, updates: Partial<Person>) => Promise<void>;
  deletePersonFromBackend: (id: string) => Promise<void>;
  saveGiftToBackend: (friendId: string, gift: Omit<SavedGift, "id" | "createdAt">) => Promise<string>;
  deleteGiftFromBackend: (giftId: string) => Promise<void>;

  // Utility actions
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useGiftStore = create<GiftStore>()(
  persist(
    (set, get) => ({
      // Initial state
      people: [],
      selectedPersonId: null,
      isLoading: false,
      isSaving: false,
      error: null,

      // CRUD actions with backend sync
      addPerson: async (person) => {
        set({ isSaving: true, error: null });
        try {
          // Create locally first with temporary ID
          const tempId = crypto.randomUUID();
          const newPerson: Person = {
            ...person,
            id: tempId,
            chatHistory: [],
            giftSuggestions: [],
            savedGifts: [],
          };

          // Add to local state immediately (optimistic update)
          set((state) => ({
            people: [...state.people, newPerson],
            isSaving: false,
          }));

          // Sync to backend
          const response = await friendsApi.createFriend(person);
          if (response.success && response.data) {
            // Replace temp ID with actual backend ID
            set((state) => ({
              people: state.people.map((p) =>
                p.id === tempId ? { ...p, id: response.data!.id } : p
              ),
            }));
          } else {
            // Rollback on error
            set((state) => ({
              people: state.people.filter((p) => p.id !== tempId),
              error: response.error || "Failed to save person",
            }));
          }
        } catch (error) {
          console.error("Error adding person:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to add person",
            isSaving: false,
          });
        }
      },

      updatePerson: async (id, updates) => {
        set({ isSaving: true, error: null });
        try {
          // Update locally (optimistic)
          const previousPeople = get().people;
          set((state) => ({
            people: state.people.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
            isSaving: false,
          }));

          // Sync to backend
          const response = await friendsApi.updateFriend(id, updates);
          if (!response.success) {
            // Rollback on error
            set({ people: previousPeople, error: response.error || "Failed to update person" });
          }
        } catch (error) {
          console.error("Error updating person:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to update person",
            isSaving: false,
          });
        }
      },

      deletePerson: async (id) => {
        set({ isSaving: true, error: null });
        try {
          // Store previous state for rollback
          const previousPeople = get().people;
          const wasSelected = get().selectedPersonId === id;

          // Delete locally (optimistic)
          set((state) => ({
            people: state.people.filter((p) => p.id !== id),
            selectedPersonId: wasSelected ? null : state.selectedPersonId,
            isSaving: false,
          }));

          // Sync to backend
          const response = await friendsApi.deleteFriend(id);
          if (!response.success) {
            // Rollback on error
            set({
              people: previousPeople,
              selectedPersonId: get().selectedPersonId,
              error: response.error || "Failed to delete person",
            });
          }
        } catch (error) {
          console.error("Error deleting person:", error);
          set({
            error: error instanceof Error ? error.message : "Failed to delete person",
            isSaving: false,
          });
        }
      },

      selectPerson: (id) => set({ selectedPersonId: id }),

      addChatMessage: (personId, message) =>
        set((state) => ({
          people: state.people.map((p) =>
            p.id === personId
              ? {
                  ...p,
                  chatHistory: [
                    ...p.chatHistory,
                    {
                      ...message,
                      id: crypto.randomUUID(),
                      timestamp: new Date(),
                    },
                  ],
                }
              : p
          ),
        })),

      updateInterests: (personId, interests) =>
        set((state) => ({
          people: state.people.map((p) =>
            p.id === personId ? { ...p, interests } : p
          ),
        })),

      updateDislikes: (personId, dislikes) =>
        set((state) => ({
          people: state.people.map((p) =>
            p.id === personId ? { ...p, dislikes } : p
          ),
        })),

      setGiftSuggestions: (personId, suggestions) =>
        set((state) => ({
          people: state.people.map((p) =>
            p.id === personId ? { ...p, giftSuggestions: suggestions } : p
          ),
        })),

  // Backend sync methods
  loadFromBackend: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch friends (backend uses hardcoded default user)
      const friendsResponse = await friendsApi.getFriends();
          if (!friendsResponse.success || !friendsResponse.data) {
            set({ isLoading: false, error: friendsResponse.error || "Failed to load people" });
            return;
          }

          // Fetch gifts for each friend
          const peopleWithGifts = await Promise.all(
            friendsResponse.data.map(async (friend) => {
              const giftsResponse = await giftsApi.getGiftsByFriend(friend.id);
              const gifts = giftsResponse.success && giftsResponse.data ? giftsResponse.data : [];
              return friendsApi.backendFriendToPerson(friend, gifts);
            })
          );

          set({
            people: peopleWithGifts,
            isLoading: false,
          });
        } catch (error) {
          console.error("Error loading from backend:", error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to load data",
          });
        }
      },

      savePersonToBackend: async (person) => {
        set({ isSaving: true, error: null });
        try {
          const response = await friendsApi.createFriend(person);
          if (response.success && response.data) {
            set({ isSaving: false });
            return response.data.id;
          } else {
            throw new Error(response.error || "Failed to save person");
          }
        } catch (error) {
          console.error("Error saving person to backend:", error);
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : "Failed to save person",
          });
          throw error;
        }
      },

      updatePersonInBackend: async (id, updates) => {
        set({ isSaving: true, error: null });
        try {
          const response = await friendsApi.updateFriend(id, updates);
          if (!response.success) {
            throw new Error(response.error || "Failed to update person");
          }
          set({ isSaving: false });
        } catch (error) {
          console.error("Error updating person in backend:", error);
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : "Failed to update person",
          });
          throw error;
        }
      },

      deletePersonFromBackend: async (id) => {
        set({ isSaving: true, error: null });
        try {
          const response = await friendsApi.deleteFriend(id);
          if (!response.success) {
            throw new Error(response.error || "Failed to delete person");
          }
          set({ isSaving: false });
        } catch (error) {
          console.error("Error deleting person from backend:", error);
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : "Failed to delete person",
          });
          throw error;
        }
      },

      saveGiftToBackend: async (friendId, gift) => {
        set({ isSaving: true, error: null });
        try {
          const response = await giftsApi.createGift({
            friendId,
            name: gift.name,
            description: gift.description,
            price: gift.price,
            purchaseUrl: gift.purchaseUrl,
            imageUrl: gift.imageUrl,
            occasion: gift.occasion,
            notes: gift.notes,
            status: gift.status,
          });

          if (response.success && response.data) {
            // Add to local person
            const savedGift = giftsApi.backendGiftToSavedGift(response.data);
            set((state) => ({
              people: state.people.map((p) =>
                p.id === friendId
                  ? {
                      ...p,
                      savedGifts: [...(p.savedGifts || []), savedGift],
                    }
                  : p
              ),
              isSaving: false,
            }));
            return response.data.id;
          } else {
            throw new Error(response.error || "Failed to save gift");
          }
        } catch (error) {
          console.error("Error saving gift to backend:", error);
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : "Failed to save gift",
          });
          throw error;
        }
      },

      deleteGiftFromBackend: async (giftId) => {
        set({ isSaving: true, error: null });
        try {
          const response = await giftsApi.deleteGift(giftId);
          if (!response.success) {
            throw new Error(response.error || "Failed to delete gift");
          }

          // Remove from local state
          set((state) => ({
            people: state.people.map((p) => ({
              ...p,
              savedGifts: (p.savedGifts || []).filter((g) => g.id !== giftId),
            })),
            isSaving: false,
          }));
        } catch (error) {
          console.error("Error deleting gift from backend:", error);
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : "Failed to delete gift",
          });
          throw error;
        }
      },

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "orbit-storage",
      partialize: (state) => ({
        people: state.people,
      }),
    }
  )
);
