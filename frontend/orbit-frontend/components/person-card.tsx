"use client";

import { Person } from "@/lib/types";
import { useGiftStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, Trash2, MessageCircle, Gift, Loader2, Pencil, Sparkles, Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";

interface PersonCardProps {
  person: Person;
  onChat: () => void;
  onGenerateGifts: () => void;
  onEdit?: () => void;
}

export function PersonCard({ person, onChat, onGenerateGifts, onEdit }: PersonCardProps) {
  const { deletePerson, selectPerson, selectedPersonId, isSaving } = useGiftStore();
  const isSelected = selectedPersonId === person.id;
  const [isDeleting, setIsDeleting] = useState(false);

  const birthdayDate = new Date(person.birthday);
  const formattedBirthday = format(birthdayDate, "MMMM d");

  const handleCardClick = () => {
    if (onEdit) {
      onEdit();
    } else {
      selectPerson(person.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting || isSaving) return;

    if (confirm(`Are you sure you want to delete ${person.name}?`)) {
      setIsDeleting(true);
      try {
        await deletePerson(person.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? "ring-2 ring-primary shadow-lg" : ""
      } ${isDeleting ? "opacity-50" : ""}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-balance">{person.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{person.relationship}</p>
          </div>
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit {person.name}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">Delete {person.name}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formattedBirthday}</span>
        </div>

        {person.holidays.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {person.holidays.slice(0, 3).map((holiday) => (
              <Badge key={holiday} className="text-xs bg-secondary/10 text-secondary hover:bg-secondary/20">
                {holiday}
              </Badge>
            ))}
            {person.holidays.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{person.holidays.length - 3}
              </Badge>
            )}
          </div>
        )}

        {person.interests.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground truncate">
              {person.interests.slice(0, 2).join(", ")}
              {person.interests.length > 2 && "..."}
            </span>
          </div>
        )}

        {/* Saved Gifts Timeline */}
        {person.savedGifts && person.savedGifts.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="h-3.5 w-3.5 text-secondary" />
              <span className="text-xs font-medium text-muted-foreground">
                {person.savedGifts.length} saved gift{person.savedGifts.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {person.savedGifts.slice(0, 4).map((gift) => (
                <div
                  key={gift.id}
                  className="relative flex-shrink-0 group/gift cursor-pointer hover:scale-110 transition-transform"
                  title={`${gift.name} - ${gift.status} (Click to view)`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateGifts();
                  }}
                >
                  {gift.imageUrl ? (
                    <img
                      src={gift.imageUrl}
                      alt={gift.name}
                      className="w-10 h-10 rounded-lg object-cover border border-border/50 hover:border-secondary"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-border/50 hover:border-secondary">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  {/* Status indicator */}
                  <div
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2 border-card",
                      gift.status === "idea" && "bg-blue-500",
                      gift.status === "purchased" && "bg-green-500",
                      gift.status === "wrapped" && "bg-purple-500",
                      gift.status === "given" && "bg-secondary"
                    )}
                  >
                    {gift.status === "idea" && <Sparkles className="h-2 w-2 text-white" />}
                    {gift.status === "purchased" && <Check className="h-2 w-2 text-white" />}
                    {gift.status === "wrapped" && <Package className="h-2 w-2 text-white" />}
                    {gift.status === "given" && <Gift className="h-2 w-2 text-white" />}
                  </div>
                </div>
              ))}
              {person.savedGifts.length > 4 && (
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-xs font-medium text-muted-foreground border border-border/50">
                  +{person.savedGifts.length - 4}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onChat();
            }}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Chat
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-secondary hover:bg-secondary/90"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateGifts();
            }}
          >
            <Gift className="h-4 w-4 mr-1" />
            Gifts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
