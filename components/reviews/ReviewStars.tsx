import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating display. `rating` may be fractional (averages). */
export function ReviewStars({
  rating,
  size = 16,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`דירוג ${rating} מתוך 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={
            n <= rounded ? "fill-accent text-accent" : "text-primary-200"
          }
          aria-hidden
        />
      ))}
    </div>
  );
}
