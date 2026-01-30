"use client";

import React from "react"

import { useState } from "react";
import { useGiftStore } from "@/lib/store";
import { HOLIDAYS, RELATIONSHIPS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, UserPlus } from "lucide-react";

export function AddPersonForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [relationship, setRelationship] = useState("");
  const [selectedHolidays, setSelectedHolidays] = useState<string[]>([]);
  const { addPerson, isSaving, error, clearError } = useGiftStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !birthday || !relationship) return;

    clearError();

    await addPerson({
      name,
      birthday,
      relationship,
      holidays: selectedHolidays,
      interests: [],
      dislikes: [],
    });

    // Only close form if there was no error
    if (!error) {
      setName("");
      setBirthday("");
      setRelationship("");
      setSelectedHolidays([]);
      setOpen(false);
    }
  };

  const toggleHoliday = (holiday: string) => {
    setSelectedHolidays((prev) =>
      prev.includes(holiday)
        ? prev.filter((h) => h !== holiday)
        : [...prev, holiday]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <UserPlus className="h-5 w-5" />
          Add Person
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a New Person</DialogTitle>
          <DialogDescription>
            Create a profile for someone you want to find gifts for.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter their name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthday">Birthday</Label>
            <Input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((rel) => (
                  <SelectItem key={rel} value={rel}>
                    {rel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Gift-Giving Occasions</Label>
            <ScrollArea className="h-48 rounded-md border p-4">
              <div className="grid grid-cols-2 gap-3">
                {HOLIDAYS.map((holiday) => (
                  <div key={holiday} className="flex items-center space-x-2">
                    <Checkbox
                      id={holiday}
                      checked={selectedHolidays.includes(holiday)}
                      onCheckedChange={() => toggleHoliday(holiday)}
                    />
                    <Label
                      htmlFor={holiday}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {holiday}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Person
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
