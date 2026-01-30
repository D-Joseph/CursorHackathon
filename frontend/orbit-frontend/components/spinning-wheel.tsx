"use client";

import { useState, useRef, useEffect } from "react";
import { Person } from "@/lib/types";
import { useGiftStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gift, Sparkles, Loader2, RotateCcw } from "lucide-react";

interface SpinningWheelProps {
  person: Person;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WHEEL_COLORS = [
  "#E57373",
  "#F06292",
  "#BA68C8",
  "#9575CD",
  "#7986CB",
  "#64B5F6",
  "#4FC3F7",
  "#4DD0E1",
  "#4DB6AC",
  "#81C784",
  "#AED581",
  "#DCE775",
];

export function SpinningWheel({ person, open, onOpenChange }: SpinningWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [savedGiftId, setSavedGiftId] = useState<string | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const { setGiftSuggestions, saveGiftToBackend, error, clearError } = useGiftStore();

  const gifts = person.giftSuggestions;

  useEffect(() => {
    if (open) {
      setSelectedGift(null);
      setSavedGiftId(null);
      setRotation(0);
    }
  }, [open]);

  const handleSaveGift = async () => {
    if (!selectedGift || isSaving) return;

    clearError();
    setIsSaving(true);

    try {
      const giftId = await saveGiftToBackend(person.id, {
        name: selectedGift,
        description: `Gift idea for ${person.name}`,
        purchaseUrl: "",
        status: "idea",
      });
      setSavedGiftId(giftId);
    } catch (error) {
      console.error("Error saving gift:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const generateGifts = async () => {
    setIsGenerating(true);
    setSelectedGift(null);

    try {
      const response = await fetch("/api/generate-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName: person.name,
          relationship: person.relationship,
          interests: person.interests,
          dislikes: person.dislikes,
          holidays: person.holidays,
        }),
      });

      const data = await response.json();

      if (data.gifts && data.gifts.length > 0) {
        setGiftSuggestions(person.id, data.gifts);
      }
    } catch (error) {
      console.error("Error generating gifts:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const spinWheel = () => {
    if (isSpinning || gifts.length === 0) return;

    setIsSpinning(true);
    setSelectedGift(null);

    // Calculate random spin
    const extraSpins = 5 + Math.random() * 3; // 5-8 full rotations
    const randomIndex = Math.floor(Math.random() * gifts.length);
    const segmentAngle = 360 / gifts.length;
    const targetAngle = 360 - (randomIndex * segmentAngle + segmentAngle / 2);
    const totalRotation = rotation + extraSpins * 360 + targetAngle;

    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedGift(gifts[randomIndex]);
    }, 4000);
  };

  const resetWheel = () => {
    setSelectedGift(null);
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Gift Ideas for {person.name}
          </DialogTitle>
          <DialogDescription>
            {gifts.length === 0
              ? "Generate personalized gift suggestions based on their interests."
              : "Spin the wheel to pick a random gift, or choose from the list below."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {gifts.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-6">
                {person.interests.length === 0
                  ? "Chat with the assistant first to add some interests!"
                  : "Ready to generate gift ideas based on their interests."}
              </p>
              <Button
                onClick={generateGifts}
                disabled={isGenerating || person.interests.length === 0}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Gift Ideas
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Spinning Wheel */}
              <div className="relative flex items-center justify-center">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
                  <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
                </div>

                {/* Wheel */}
                <div
                  ref={wheelRef}
                  className="relative w-64 h-64 rounded-full border-4 border-foreground/20 shadow-xl overflow-hidden"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning
                      ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                      : "none",
                  }}
                >
                  {gifts.map((gift, index) => {
                    const segmentAngle = 360 / gifts.length;
                    const startAngle = index * segmentAngle;

                    return (
                      <div
                        key={gift}
                        className="absolute w-full h-full"
                        style={{
                          transform: `rotate(${startAngle}deg)`,
                          transformOrigin: "50% 50%",
                        }}
                      >
                        <div
                          className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left flex items-center justify-start pl-4"
                          style={{
                            transform: `rotate(${segmentAngle / 2}deg)`,
                            backgroundColor: WHEEL_COLORS[index % WHEEL_COLORS.length],
                            clipPath: `polygon(0 100%, 100% ${100 - Math.tan((segmentAngle * Math.PI) / 360) * 100}%, 100% 100%)`,
                          }}
                        >
                          <span
                            className="text-xs font-medium text-white truncate max-w-[70px] transform -rotate-90 origin-left"
                            style={{
                              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                            }}
                          >
                            {gift.length > 12 ? gift.substring(0, 12) + "..." : gift}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Center circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background border-4 border-foreground/20 shadow-lg flex items-center justify-center">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>

              {/* Selected Gift Display */}
              {selectedGift && (
                <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Selected Gift:</p>
                    <p className="text-lg font-semibold text-primary">{selectedGift}</p>
                  </div>
                  {savedGiftId ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                      <Gift className="h-4 w-4" />
                      Gift saved!
                    </div>
                  ) : (
                    <Button
                      onClick={handleSaveGift}
                      disabled={isSaving}
                      size="sm"
                      className="gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Gift className="h-4 w-4" />
                          Save This Gift
                        </>
                      )}
                    </Button>
                  )}
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={spinWheel}
                  disabled={isSpinning}
                  size="lg"
                  className="gap-2"
                >
                  {isSpinning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Spinning...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4" />
                      Spin the Wheel
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetWheel}
                  disabled={isSpinning}
                  size="lg"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="sr-only">Reset</span>
                </Button>
              </div>

              {/* Gift List */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">All Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {gifts.map((gift) => (
                    <Badge
                      key={gift}
                      variant={selectedGift === gift ? "default" : "secondary"}
                      className="cursor-pointer transition-colors"
                      onClick={() => !isSpinning && setSelectedGift(gift)}
                    >
                      {gift}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Saved Gifts Section */}
              {person.savedGifts && person.savedGifts.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Saved Gifts:</p>
                  <div className="flex flex-wrap gap-2">
                    {person.savedGifts.map((gift) => (
                      <Badge
                        key={gift.id}
                        variant="outline"
                        className="gap-1"
                      >
                        <Gift className="h-3 w-3" />
                        {gift.name}
                        <span className="text-muted-foreground ml-1">
                          ({gift.status})
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Regenerate Button */}
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  onClick={generateGifts}
                  disabled={isGenerating || isSpinning}
                  className="text-muted-foreground"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate New Ideas
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
