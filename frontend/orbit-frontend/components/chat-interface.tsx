"use client";

import { useState, useRef, useEffect } from "react";
import { Person } from "@/lib/types";
import { useGiftStore } from "@/lib/store";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ChatInterfaceProps {
  person: Person;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatInterface({ person: personProp, open, onOpenChange }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { people, addChatMessage, updateInterests, updateDislikes } = useGiftStore();

  // Get the latest person data from the store to ensure UI updates
  const person = people.find(p => p.id === personProp.id) || personProp;

  // Handle wheel scrolling as a fallback
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollHeight > el.clientHeight) {
        // Element can scroll, let native scroll work
        return;
      }
      // Element can't scroll natively, prevent wheel
      if (e.deltaY !== 0) {
        e.preventDefault();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [person.chatHistory.length]);

  useEffect(() => {
    // Only auto-scroll on new messages, not during user scroll
    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    };
    // Small delay to ensure content is rendered
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [person.chatHistory.length]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage("");
    addChatMessage(person.id, { role: "user", content: userMessage });
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          personName: person.name,
          relationship: person.relationship,
          currentInterests: person.interests,
          currentDislikes: person.dislikes,
          chatHistory: person.chatHistory.slice(-10),
          personId: person.id,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        addChatMessage(person.id, {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        });
      } else {
        addChatMessage(person.id, { role: "assistant", content: data.response });
        
        if (data.interests && data.interests.length > 0) {
          const newInterests = [...new Set([...person.interests, ...data.interests])];
          updateInterests(person.id, newInterests);
        }
        if (data.dislikes && data.dislikes.length > 0) {
          const newDislikes = [...new Set([...person.dislikes, ...data.dislikes])];
          updateDislikes(person.id, newDislikes);
        }
      }
    } catch {
      addChatMessage(person.id, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Overlay */}
      <div 
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', cursor: 'pointer' }} 
        onClick={() => onOpenChange(false)}
      />
      
      {/* Chat Panel */}
      <div style={{ 
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '100%', 
        maxWidth: '32rem', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--background)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        zIndex: 51
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1rem', 
          borderBottom: '1px solid var(--border)' 
        }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Chat about {person.name}</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', margin: '0.25rem 0 0' }}>
              Tell me about their interests, hobbies, and preferences
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {(person.interests.length > 0 || person.dislikes.length > 0) && (
            <div style={{ 
              padding: '1rem', 
              paddingBottom: '0.5rem', 
              borderBottom: '1px solid var(--border)',
              flexShrink: 0
            }}>
              {person.interests.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                    Interests
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {person.interests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="secondary"
                        style={{ fontSize: '0.75rem' }}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {person.dislikes.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
                    Dislikes
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {person.dislikes.map((dislike) => (
                      <Badge
                        key={dislike}
                        variant="outline"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        {dislike}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div 
            ref={scrollRef}
            style={{ 
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorY: 'contain',
              padding: '1rem',
              cursor: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--border) transparent'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {person.chatHistory.length === 0 && (
                <div style={{ textAlign: 'center', paddingTop: '2rem', paddingBottom: '2rem' }}>
                  <div style={{ 
                    height: '3rem', 
                    width: '3rem', 
                    margin: '0 auto 0.75rem',
                    backgroundColor: 'var(--muted)', 
                    borderRadius: '9999px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    Start a conversation to tell me about {person.name}&apos;s
                    interests and preferences.
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
                    For example: &ldquo;They love cooking and outdoor activities&rdquo;
                  </p>
                </div>
              )}
              {person.chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  style={{ 
                    display: 'flex', 
                    gap: '0.75rem',
                    flexDirection: msg.role === "user" ? 'row-reverse' : 'row'
                  }}
                >
                  <div
                    style={{
                      height: '2rem',
                      width: '2rem',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      backgroundColor: msg.role === "user" ? 'var(--primary)' : 'var(--muted)',
                      color: msg.role === "user" ? 'var(--primary-foreground)' : 'var(--muted-foreground)'
                    }}
                  >
                    {msg.role === "user" ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div
                    style={{
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      maxWidth: '80%',
                      backgroundColor: msg.role === "user" ? 'var(--primary)' : 'var(--muted)',
                      color: msg.role === "user" ? 'var(--primary-foreground)' : 'var(--muted-foreground)'
                    }}
                  >
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ 
                    height: '2rem', 
                    width: '2rem', 
                    borderRadius: '9999px', 
                    backgroundColor: 'var(--muted)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <svg className="h-4 w-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <div style={{ borderRadius: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--muted)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            padding: '1rem', 
            borderTop: '1px solid var(--border)',
            flexShrink: 0
          }}>
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isLoading}
              style={{ flex: 1 }}
            />
            <Button onClick={handleSend} disabled={isLoading || !message.trim()}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
