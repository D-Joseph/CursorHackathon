"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, Heart, Loader2, Check, Package, AlertTriangle, XCircle, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShoppingProduct } from "@/lib/types";
import { StarRating } from "./star-rating";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import confetti from "canvas-confetti";

interface GiftProductCardProps {
  product: ShoppingProduct;
  onSave: (product: ShoppingProduct) => Promise<void>;
  isSaved?: boolean;
  index?: number;
}

export function GiftProductCard({
  product,
  onSave,
  isSaved = false,
  index = 0,
}: GiftProductCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Stagger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const triggerConfetti = () => {
    if (saveButtonRef.current) {
      const rect = saveButtonRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x, y },
        colors: ["#25AAE1", "#F7AB23", "#945C92", "#D43B19"],
        ticks: 100,
        gravity: 1.2,
        scalar: 0.8,
        shapes: ["circle", "square"],
      });
    }
  };

  const handleSave = async () => {
    if (saved) return;
    setIsSaving(true);
    try {
      await onSave(product);
      setSaved(true);
      triggerConfetti();
    } catch (error) {
      console.error("Failed to save gift:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (value: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const getDiscountPercentage = () => {
    if (product.price?.isOnSale && product.price?.originalPrice) {
      const discount = ((product.price.originalPrice - product.price.value) / product.price.originalPrice) * 100;
      return Math.round(discount);
    }
    return null;
  };

  const discountPercentage = getDiscountPercentage();

  const getAvailabilityBadge = () => {
    switch (product.availability) {
      case "in_stock":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
            <Check className="h-3 w-3 mr-1" />
            In Stock
          </Badge>
        );
      case "limited":
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Limited
          </Badge>
        );
      case "out_of_stock":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Out of Stock
          </Badge>
        );
      default:
        return null;
    }
  };

  const isOutOfStock = product.availability === "out_of_stock";

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative flex flex-col rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50",
        "shadow-md hover:shadow-2xl transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:ring-2 hover:ring-accent/50",
        isOutOfStock && "opacity-60 pointer-events-none",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Sale Badge */}
      {discountPercentage && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-destructive text-white font-bold text-xs px-2 py-1 rounded-full shadow-lg">
            {discountPercentage}% OFF
          </Badge>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-t-2xl bg-muted/30">
        {product.imageUrl && !imageError ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
            <Package className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>

        {/* Description/Snippet */}
        {product.snippet && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.snippet}
          </p>
        )}

        {/* Rating */}
        {product.rating && product.rating.reviewCount > 0 && (
          <StarRating
            score={product.rating.score}
            reviewCount={product.rating.reviewCount}
            size="sm"
          />
        )}

        {/* Price Section */}
        <div className="flex flex-col gap-1">
          {product.price ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-secondary">
                  {formatPrice(product.price.value, product.price.currency)}
                </span>
              </div>
              {product.price.isOnSale && product.price.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.price.originalPrice, product.price.currency)}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Price unavailable</span>
          )}
        </div>

        {/* Availability & Source */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {getAvailabilityBadge()}
          <Badge variant="secondary" className="text-xs font-medium">
            <ShoppingBag className="h-3 w-3 mr-1" />
            {product.source}
          </Badge>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-2">
          <Button
            ref={saveButtonRef}
            onClick={handleSave}
            disabled={isSaving || saved}
            variant={saved ? "outline" : "default"}
            className={cn(
              "w-full transition-all duration-200",
              saved && "bg-green-500/10 text-green-600 border-green-500/30"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Saved to Orbit
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Save to Orbit
              </>
            )}
          </Button>

          <Button
            asChild
            variant="secondary"
            className="w-full"
          >
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buy Now
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
