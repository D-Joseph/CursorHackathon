"use client";

import { useState } from "react";
import { useGiftStore } from "@/lib/store";
import { Person } from "@/lib/types";
import { AddPersonForm } from "@/components/add-person-form";
import { PersonCard } from "@/components/person-card";
import { ChatInterface } from "@/components/chat-interface";
import { SpinningWheel } from "@/components/spinning-wheel";
import { Gift, Users, Sparkles } from "lucide-react";

export default function Home() {
  const { people } = useGiftStore();
  const [chatPerson, setChatPerson] = useState<Person | null>(null);
  const [giftPerson, setGiftPerson] = useState<Person | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Gift className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">GiftGenius</h1>
                <p className="text-xs text-muted-foreground">Smart gift suggestions</p>
              </div>
            </div>
            <AddPersonForm />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {people.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="relative mb-8">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3 text-balance">
              Start Your Gift List
            </h2>
            <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
              Add friends and family members to get personalized gift suggestions
              based on their interests and preferences.
            </p>
            <AddPersonForm />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Your People</h2>
                <p className="text-muted-foreground">
                  {people.length} {people.length === 1 ? "person" : "people"} in your gift list
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {people.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  onChat={() => setChatPerson(person)}
                  onGenerateGifts={() => setGiftPerson(person)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Chat Sheet */}
      {chatPerson && (
        <ChatInterface
          person={chatPerson}
          open={!!chatPerson}
          onOpenChange={(open) => !open && setChatPerson(null)}
        />
      )}

      {/* Gift Wheel Dialog */}
      {giftPerson && (
        <SpinningWheel
          person={giftPerson}
          open={!!giftPerson}
          onOpenChange={(open) => !open && setGiftPerson(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Find the perfect gifts for the people you love
          </p>
        </div>
      </footer>
    </div>
  );
}
