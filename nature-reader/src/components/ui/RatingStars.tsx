import React from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  className?: string;
  starClassName?: string;
}

export default function RatingStars({
  rating,
  className = "flex items-center gap-0.5",
  starClassName = "w-3.5 h-3.5"
}: RatingStarsProps) {
  const floorRating = Math.floor(rating);
  
  return (
    <div className={className}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${starClassName} ${
            i < floorRating
              ? "text-amber-450 fill-amber-400"
              : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}
