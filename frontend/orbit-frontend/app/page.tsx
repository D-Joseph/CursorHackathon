"use client";

import { useState, useEffect } from "react";
import { useGiftStore } from "@/lib/store";
import { Person } from "@/lib/types";
import { AddPersonForm } from "@/components/add-person-form";
import { PersonCard } from "@/components/person-card";
import { ChatInterface } from "@/components/chat-interface";
import { GiftResultsDisplay } from "@/components/gift-results-display";
import { Gift, Sparkles, Loader2, Heart, Calendar, MessageCircle, ChevronDown } from "lucide-react";
import { checkBackendHealth } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { people, isLoading, error, loadFromBackend, clearError } = useGiftStore();
  const [chatPerson, setChatPerson] = useState<Person | null>(null);
  const [giftPerson, setGiftPerson] = useState<Person | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  // Load data from backend on mount
  useEffect(() => {
    const initData = async () => {
      const healthy = await checkBackendHealth();
      if (healthy) {
        await loadFromBackend();
      }
    };

    initData();
  }, [loadFromBackend]);

  const handleEditComplete = () => {
    setEditingPerson(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {!showDashboard ? (
        // Landing Hero Section
        <div className="min-h-screen flex flex-col">
          <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center bg-gradient-to-b from-background via-background to-secondary/5">
            {/* Logo - larger with more space below */}
            <img
              src="/orbit-logo.png"
              alt="Orbit"
              className="h-44 w-44 mb-12 drop-shadow-2xl"
            />

            {/* Headline - bigger on desktop, more space */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 max-w-4xl leading-tight tracking-tight">
              Never Forget to <span className="text-secondary">Reach Out</span>
            </h1>

            {/* Subhead - more space, relaxed line height */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-14 max-w-2xl leading-loose">
              We all have people we love but forget to reach out to. Birthdays slip by. Months pass.
              <span className="text-foreground font-medium"> Orbit remembers so you don't have to.</span>
            </p>

            {/* Value Props - bigger gaps, hover effects */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16 max-w-5xl">
              <div className="flex flex-col items-center p-8 rounded-3xl bg-card/60 backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center mb-5">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl text-foreground mb-2">Remember Birthdays</h3>
                <p className="text-muted-foreground">Never miss another important date</p>
              </div>
              <div className="flex flex-col items-center p-8 rounded-3xl bg-card/60 backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="h-16 w-16 rounded-full bg-secondary/15 flex items-center justify-center mb-5">
                  <Gift className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="font-semibold text-xl text-foreground mb-2">Find Perfect Gifts</h3>
                <p className="text-muted-foreground">AI-powered suggestions they'll love</p>
              </div>
              <div className="flex flex-col items-center p-8 rounded-3xl bg-card/60 backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="h-16 w-16 rounded-full bg-accent/15 flex items-center justify-center mb-5">
                  <MessageCircle className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-semibold text-xl text-foreground mb-2">Stay Connected</h3>
                <p className="text-muted-foreground">Thoughtful messages, on time</p>
              </div>
            </div>

            {/* CTA Button - ORANGE, bigger, more prominent */}
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowDashboard(true)}
              className="rounded-full text-xl px-12 py-8 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300"
            >
              <Heart className="mr-3 h-6 w-6" />
              Start Your Orbit
            </Button>

            {/* Tagline - more space */}
            <p className="mt-12 text-base text-muted-foreground">
              Relationships take effort. <span className="text-secondary font-semibold">Orbit</span> makes it effortless.
            </p>

            {/* Scroll indicator */}
            <div className="mt-8 animate-bounce">
              <ChevronDown className="h-6 w-6 text-muted-foreground" />
            </div>
          </section>
        </div>
      ) : (
        // Dashboard Section
        <>
          {/* Header */}
          <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowDashboard(false)}>
                  <img
                    src="/orbit-logo.png"
                    alt="Orbit"
                    className="h-12 w-12"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Orbit</h1>
                    <p className="text-xs text-muted-foreground">Never Forget to Reach Out</p>
                  </div>
                </div>
                {/* Just the Add Person button - clean and simple */}
                <AddPersonForm
                  editingPerson={editingPerson}
                  onEditComplete={handleEditComplete}
                />
              </div>
            </div>
          </header>

          <main className="container mx-auto px-6 py-10">
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
                <h2 className="text-xl font-semibold text-foreground mb-2">Loading your circle...</h2>
                <p className="text-muted-foreground">Syncing data from the server</p>
              </div>
            ) : people.length === 0 ? (
              // Empty State
              <div className="text-center py-24 px-6">
                <div className="relative inline-block mb-10">
                  <div className="h-28 w-28 rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
                    <Heart className="h-14 w-14 text-secondary" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-primary" />
                </div>
                <h2 className="text-4xl font-bold text-foreground mb-5">Your Orbit Awaits</h2>
                <p className="text-muted-foreground mb-10 max-w-lg mx-auto text-xl leading-relaxed">
                  Add the people you care about. Orbit will help you remember birthdays, find the perfect gifts, and never let too much time pass without reaching out.
                </p>
                <AddPersonForm
                  editingPerson={editingPerson}
                  onEditComplete={handleEditComplete}
                />
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Your People</h2>
                    <p className="text-muted-foreground">
                      {people.length} {people.length === 1 ? "person" : "people"} in your circle
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
                      onEdit={() => setEditingPerson(person)}
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

          {/* Gift Results Display */}
          {giftPerson && (
            <GiftResultsDisplay
              person={giftPerson}
              open={!!giftPerson}
              onOpenChange={(open) => !open && setGiftPerson(null)}
            />
          )}

          {/* Footer */}
          <footer className="border-t py-6 mt-auto">
            <p className="text-center text-sm text-muted-foreground">
              Relationships take effort. <span className="text-secondary font-medium">Orbit</span> makes it effortless.
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
