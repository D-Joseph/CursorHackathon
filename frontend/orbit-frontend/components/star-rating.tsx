"use client";

import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  score: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export function StarRating({
  score,
  reviewCount,
  size = "md",
  showCount = true,
  className,
}: StarRatingProps) {
  const normalizedScore = Math.max(0, Math.min(5, score));
  const fullStars = Math.floor(normalizedScore);
  const hasHalfStar = normalizedScore % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const starSize = sizeClasses[size];

  const formatReviewCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    }
    return count.toLocaleString();
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(starSize, "fill-secondary text-secondary")}
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star
              className={cn(starSize, "text-muted-foreground/30")}
            />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star
                className={cn(starSize, "fill-secondary text-secondary")}
              />
            </div>
          </div>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(starSize, "text-muted-foreground/30")}
          />
        ))}
      </div>

      {/* Review count */}
      {showCount && reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground ml-1">
          ({formatReviewCount(reviewCount)})
        </span>
      )}
    </div>
  );
}
