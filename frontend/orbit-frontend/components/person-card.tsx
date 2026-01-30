"use client";

import { Person } from "@/lib/types";
import { useGiftStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, Trash2, MessageCircle, Gift } from "lucide-react";
import { format } from "date-fns";

interface PersonCardProps {
  person: Person;
  onChat: () => void;
  onGenerateGifts: () => void;
}

export function PersonCard({ person, onChat, onGenerateGifts }: PersonCardProps) {
  const { deletePerson, selectPerson, selectedPersonId } = useGiftStore();
  const isSelected = selectedPersonId === person.id;

  const birthdayDate = new Date(person.birthday);
  const formattedBirthday = format(birthdayDate, "MMMM d");

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? "ring-2 ring-primary shadow-lg" : ""
      }`}
      onClick={() => selectPerson(person.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-balance">{person.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{person.relationship}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              deletePerson(person.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete {person.name}</span>
          </Button>
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
              <Badge key={holiday} variant="secondary" className="text-xs">
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
            className="flex-1"
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
