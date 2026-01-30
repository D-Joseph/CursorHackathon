"use client";

import { useState, useEffect } from "react";
import { useGiftStore } from "@/lib/store";
import { Person } from "@/lib/types";
import { AddPersonForm } from "@/components/add-person-form";
import { PersonCard } from "@/components/person-card";
import { ChatInterface } from "@/components/chat-interface";
import { SpinningWheel } from "@/components/spinning-wheel";
import { Gift, Users, Sparkles, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { checkBackendHealth } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { people, isLoading, error, loadFromBackend, clearError } = useGiftStore();
  const [chatPerson, setChatPerson] = useState<Person | null>(null);
  const [giftPerson, setGiftPerson] = useState<Person | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  // Load data from backend on mount
  useEffect(() => {
    const initData = async () => {
      // Check backend health
      const healthy = await checkBackendHealth();
      setIsBackendConnected(healthy);

      if (healthy) {
        await loadFromBackend();
      }
    };

    initData();
  }, [loadFromBackend]);

  const handleRefresh = async () => {
    clearError();
    setIsBackendConnected(await checkBackendHealth());
    await loadFromBackend();
  };

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
            <div className="flex items-center gap-3">
              {/* Backend connection status */}
              {isBackendConnected === null ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking connection...
                </div>
              ) : isBackendConnected ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Wifi className="h-4 w-4" />
                  Connected
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <WifiOff className="h-4 w-4" />
                  Offline
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Sync
              </Button>
              <AddPersonForm />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center justify-between">
              <p className="text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Loading your people...</h2>
            <p className="text-muted-foreground">Syncing data from the server</p>
          </div>
        ) : people.length === 0 ? (
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
