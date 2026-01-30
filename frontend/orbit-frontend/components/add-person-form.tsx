"use client";

import React, { useState, useEffect } from "react"

import { useGiftStore } from "@/lib/store";
import { HOLIDAYS, RELATIONSHIPS, Person } from "@/lib/types";
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
import { Plus, UserPlus, Loader2, Pencil } from "lucide-react";

interface AddPersonFormProps {
  editingPerson?: Person | null;
  onEditComplete?: () => void;
}

export function AddPersonForm({ editingPerson, onEditComplete }: AddPersonFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [relationship, setRelationship] = useState("");
  const [selectedHolidays, setSelectedHolidays] = useState<string[]>([]);
  const [interests, setInterests] = useState("");
  const [dislikes, setDislikes] = useState("");
  const { addPerson, updatePerson, isSaving, error, clearError } = useGiftStore();

  // Pre-fill form when editing
  useEffect(() => {
    if (editingPerson) {
      setName(editingPerson.name);
      setBirthday(editingPerson.birthday);
      setRelationship(editingPerson.relationship);
      setSelectedHolidays(editingPerson.holidays || []);
      setInterests(editingPerson.interests?.join(", ") || "");
      setDislikes(editingPerson.dislikes?.join(", ") || "");
      setOpen(true);
    }
  }, [editingPerson]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      // Small delay to allow the dialog animation to complete
      setTimeout(() => {
        if (!editingPerson) {
          setName("");
          setBirthday("");
          setRelationship("");
          setSelectedHolidays([]);
          setInterests("");
          setDislikes("");
        }
      }, 200);
    }
  }, [open, editingPerson]);

  // Reset form when editingPerson changes (for external resets)
  useEffect(() => {
    if (!editingPerson && open) {
      setName("");
      setBirthday("");
      setRelationship("");
      setSelectedHolidays([]);
      setInterests("");
      setDislikes("");
    }
  }, [editingPerson, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !birthday || !relationship) return;

    clearError();

    const personData = {
      name,
      birthday,
      relationship,
      holidays: selectedHolidays,
      interests: interests.split(",").map(s => s.trim()).filter(s => s),
      dislikes: dislikes.split(",").map(s => s.trim()).filter(s => s),
    };

    if (editingPerson) {
      await updatePerson(editingPerson.id, personData);
      if (!error) {
        onEditComplete?.();
        setOpen(false);
      }
    } else {
      await addPerson(personData);
      if (!error) {
        setName("");
        setBirthday("");
        setRelationship("");
        setSelectedHolidays([]);
        setInterests("");
        setDislikes("");
        setOpen(false);
      }
    }
  };

  const toggleHoliday = (holiday: string) => {
    setSelectedHolidays((prev) =>
      prev.includes(holiday)
        ? prev.filter((h) => h !== holiday)
        : [...prev, holiday]
    );
  };

  const isEditing = !!editingPerson;
  const dialogTitle = isEditing ? "Edit Person" : "Add a New Person";
  const dialogDescription = isEditing
    ? "Update the details for this person."
    : "Create a profile for someone you want to find gifts for.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? null : (
          <Button size="lg" className="gap-2">
            <UserPlus className="h-5 w-5" />
            Add Person
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
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

          <div className="space-y-2">
            <Label htmlFor="interests">Interests</Label>
            <Input
              id="interests"
              placeholder="e.g., cooking, hiking, sci-fi"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple interests with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dislikes">Dislikes</Label>
            <Input
              id="dislikes"
              placeholder="e.g., spiders, olives, waking up early"
              value={dislikes}
              onChange={(e) => setDislikes(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple dislikes with commas
            </p>
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
                {isEditing ? "Saving..." : "Adding..."}
              </>
            ) : (
              <>
                {isEditing ? (
                  <>
                    <Pencil className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Person
                  </>
                )}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
