"use client";

import { useState, useRef, useEffect } from "react";
import { Person } from "@/lib/types";
import { useGiftStore } from "@/lib/store";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Send, Bot, User, Loader2, X } from "lucide-react";

interface ChatInterfaceProps {
  person: Person;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatInterface({ person, open, onOpenChange }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addChatMessage, updateInterests, updateDislikes } = useGiftStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [person.chatHistory]);

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Chat about {person.name}</SheetTitle>
              <SheetDescription>
                Tell me about their interests, hobbies, and preferences
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0 py-4">
          {(person.interests.length > 0 || person.dislikes.length > 0) && (
            <div className="space-y-3 mb-4 pb-4 border-b">
              {person.interests.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Interests
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {person.interests.map((interest) => (
                      <Badge
                        key={interest}
                        variant="secondary"
                        className="text-xs"
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {person.dislikes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Dislikes
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {person.dislikes.map((dislike) => (
                      <Badge
                        key={dislike}
                        variant="outline"
                        className="text-xs"
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

          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {person.chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Start a conversation to tell me about {person.name}&apos;s
                    interests and preferences.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    For example: &ldquo;They love cooking and outdoor activities&rdquo;
                  </p>
                </div>
              )}
              {person.chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t mt-4">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !message.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
