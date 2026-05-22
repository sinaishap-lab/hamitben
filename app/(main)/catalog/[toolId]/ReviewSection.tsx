"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { formatDateHe, cn } from "@/lib/utils";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string };
};

export function ReviewSection({
  toolId,
  initialReviews,
  canReview,
  alreadyReviewed,
}: {
  toolId: string;
  initialReviews: Review[];
  canReview: boolean;
  alreadyReviewed: boolean;
}) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [reviewed, setReviewed] = useState(alreadyReviewed);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = reviews.length;
  const average =
    count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  async function submit() {
    if (rating < 1) {
      setError("יש לבחור דירוג");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId, rating, comment: comment || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((list) => [data.review as Review, ...list]);
        setReviewed(true);
        setRating(0);
        setComment("");
      } else {
        setError(data.message ?? "שליחת הדירוג נכשלה");
      }
    } catch {
      setError("בעיית רשת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">דירוגים וביקורות</h2>
        {count > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <ReviewStars rating={average} />
            <span className="font-bold">{average.toFixed(1)}</span>
            <span className="text-text-muted">({count})</span>
          </div>
        )}
      </div>

      {/* Review form — only for verified borrowers who haven't reviewed yet */}
      {canReview && !reviewed && (
        <div className="bg-bg-surface border border-primary-100 rounded-2xl p-3 flex flex-col gap-2">
          <p className="text-sm font-medium">דרג את הכלי</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} כוכבים`}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    "w-7 h-7 transition-colors",
                    n <= (hover || rating)
                      ? "fill-accent text-accent"
                      : "text-primary-200"
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="ספר על החוויה (אופציונלי)"
            className="w-full rounded-xl border border-primary-100 bg-bg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
          {error && <Alert variant="error">{error}</Alert>}
          <Button size="md" onClick={submit} loading={loading} className="w-auto self-start">
            שלח דירוג
          </Button>
        </div>
      )}

      {canReview && reviewed && (
        <p className="text-xs text-success">תודה — הדירוג שלך נקלט.</p>
      )}

      {/* Reviews list */}
      {count === 0 ? (
        <p className="text-sm text-text-muted">
          עדיין אין דירוגים. רק מי שהשאיל את הכלי בפועל יכול לדרג.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="bg-bg-surface border border-primary-100 rounded-2xl p-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{r.user.name}</span>
                <ReviewStars rating={r.rating} size={14} />
              </div>
              {r.comment && (
                <p className="text-sm text-text mt-1">{r.comment}</p>
              )}
              <p className="text-[11px] text-text-muted mt-1">
                {formatDateHe(r.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
