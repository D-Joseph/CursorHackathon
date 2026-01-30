"use client";

import { Person } from "@/lib/types";
import { useGiftStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, Trash2, MessageCircle, Gift, Loader2, Pencil } from "lucide-react";
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
