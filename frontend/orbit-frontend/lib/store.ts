"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Person, ChatMessage } from "./types";

interface GiftStore {
  people: Person[];
  selectedPersonId: string | null;
  addPerson: (person: Omit<Person, "id" | "chatHistory" | "giftSuggestions">) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  selectPerson: (id: string | null) => void;
  addChatMessage: (personId: string, message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateInterests: (personId: string, interests: string[]) => void;
  updateDislikes: (personId: string, dislikes: string[]) => void;
  setGiftSuggestions: (personId: string, suggestions: string[]) => void;
}

export const useGiftStore = create<GiftStore>()(
  persist(
    (set) => ({
      people: [],
      selectedPersonId: null,
      addPerson: (person) =>
        set((state) => ({
          people: [
            ...state.people,
            {
              ...person,
              id: crypto.randomUUID(),
              chatHistory: [],
              giftSuggestions: [],
            },
          ],
        })),
      updatePerson: (id, updates) =>
        set((state) => ({
          people: state.people.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deletePerson: (id) =>
        set((state) => ({
          people: state.people.filter((p) => p.id !== id),
          selectedPersonId:
            state.selectedPersonId === id ? null : state.selectedPersonId,
        })),
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
    }),
    {
      name: "gift-genius-storage",
    }
  )
);
