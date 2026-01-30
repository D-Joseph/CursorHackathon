"use client";

import { useState, useEffect } from "react";
import { Person, ShoppingProduct, SavedGift } from "@/lib/types";
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
import { Gift, Sparkles, Loader2, RefreshCw, X, ShoppingBag, Heart, Check } from "lucide-react";
import { GiftProductCard } from "./gift-product-card";
import { cn } from "@/lib/utils";

interface GiftResultsDisplayProps {
  person: Person;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ProductCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="flex flex-col rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image skeleton with shimmer */}
      <div className="aspect-square w-full bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 bg-muted/30 rounded w-full relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          <div className="h-4 bg-muted/30 rounded w-3/4 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_0.2s] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </div>

        {/* Rating */}
        <div className="h-4 bg-muted/30 rounded w-24 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_0.3s] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Price */}
        <div className="h-8 bg-muted/30 rounded w-20 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_0.4s] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>

        {/* Badges */}
        <div className="flex gap-2">
          <div className="h-6 bg-muted/30 rounded-full w-16 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_0.5s] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          <div className="h-6 bg-muted/30 rounded-full w-20 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_0.6s] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 mt-4">
          <div className="h-10 bg-muted/30 rounded w-full relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_0.7s] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
          <div className="h-10 bg-muted/30 rounded w-full relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite_0.8s] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GiftResultsDisplay({ person, open, onOpenChange }: GiftResultsDisplayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ShoppingProduct[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const { saveGiftToBackend, clearError } = useGiftStore();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setError(null);
      // Pre-populate saved IDs from existing saved gifts
      if (person.savedGifts) {
        const savedIds = new Set(person.savedGifts.map((g) => g.id));
        setSavedProductIds(savedIds);
      }
    }
  }, [open, person.savedGifts]);

  const generateGiftIdeas = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setProducts([]);

    try {
      const response = await fetch("/api/shopping", {
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

      if (!response.ok) {
        throw new Error("Failed to fetch gift ideas");
      }

      const data = await response.json();

      if (data.products && data.products.length > 0) {
        setProducts(data.products);
      } else {
        setError("No gift ideas found. Try adding more interests!");
      }
    } catch (err) {
      console.error("Error generating gift ideas:", err);
      setError("Failed to generate gift ideas. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async (product: ShoppingProduct) => {
    clearError();

    const giftData: Omit<SavedGift, "id" | "createdAt"> = {
      name: product.title,
      description: product.snippet,
      price: {
        amount: product.price?.value || 0,
        currency: product.price?.currency || "USD",
        isOnSale: product.price?.isOnSale,
        originalAmount: product.price?.originalPrice,
        discountPercentage: product.price?.isOnSale && product.price?.originalPrice
          ? Math.round(((product.price.originalPrice - product.price.value) / product.price.originalPrice) * 100)
          : undefined,
      },
      purchaseUrl: product.url,
      imageUrl: product.imageUrl,
      status: "idea",
    };

    await saveGiftToBackend(person.id, giftData);
    setSavedProductIds((prev) => new Set([...prev, product.id]));
  };

  const interestTags = person.interests.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="h-6 w-6 text-primary" />
            Gift Ideas for {person.name}
          </DialogTitle>
          <DialogDescription className="text-base">
            {interestTags.length > 0 ? (
              <span className="flex items-center gap-2 flex-wrap">
                Based on:{" "}
                {interestTags.map((interest, i) => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {person.interests.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{person.interests.length - 5} more
                  </Badge>
                )}
              </span>
            ) : (
              "Add interests to get personalized gift recommendations"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
          {/* Initial state - no products yet */}
          {products.length === 0 && !isLoading && !error && (
            <div className="text-center py-12">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-full blur-xl" />
                <Sparkles className="relative h-20 w-20 text-secondary animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Discover Perfect Gifts
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                {person.interests.length === 0
                  ? `We'll find popular gift ideas for ${person.name}. Add interests for better recommendations!`
                  : `We'll search for gifts that ${person.name} will love based on their interests.`}
              </p>
              <Button
                onClick={generateGiftIdeas}
                size="lg"
                className="gap-2 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <ShoppingBag className="h-5 w-5" />
                Generate Gift Ideas
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Finding perfect gifts for {person.name}...</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                <X className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={generateGiftIdeas} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}

          {/* Products grid */}
          {products.length > 0 && !isLoading && (
            <div className="space-y-6">
              {/* Results header */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {products.length} gift ideas
                </p>
                <Button
                  onClick={generateGiftIdeas}
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Ideas
                </Button>
              </div>

              {/* Product cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <GiftProductCard
                    key={product.id}
                    product={product}
                    onSave={handleSaveProduct}
                    isSaved={savedProductIds.has(product.id)}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Saved gifts section */}
          {person.savedGifts && person.savedGifts.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Saved Gifts for {person.name}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {person.savedGifts.length} saved
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                {person.savedGifts.map((gift) => (
                  <div
                    key={gift.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    {gift.imageUrl ? (
                      <img
                        src={gift.imageUrl}
                        alt={gift.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Gift className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{gift.name}</p>
                      <div className="flex items-center gap-2">
                        {gift.price.amount > 0 && (
                          <span className="text-xs text-secondary font-semibold">
                            ${gift.price.amount.toFixed(2)}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs capitalize",
                            gift.status === "purchased" && "bg-green-500/10 text-green-600 border-green-500/30",
                            gift.status === "given" && "bg-purple-500/10 text-purple-600 border-purple-500/30",
                            gift.status === "idea" && "bg-blue-500/10 text-blue-600 border-blue-500/30"
                          )}
                        >
                          {gift.status === "idea" && <Sparkles className="h-3 w-3 mr-1" />}
                          {gift.status === "purchased" && <Check className="h-3 w-3 mr-1" />}
                          {gift.status === "given" && <Gift className="h-3 w-3 mr-1" />}
                          {gift.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
