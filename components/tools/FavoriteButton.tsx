"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Heart toggle for saving a tool. `compact` is the small overlay used on
 * catalog cards; otherwise a labelled pill for the tool detail page.
 */
export function FavoriteButton({
  toolId,
  initialFavorite,
  compact = false,
}: {
  toolId: string;
  initialFavorite: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);

  async function toggle(e: MouseEvent) {
    // The card wraps the heart's neighbourhood in a link — don't navigate.
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tools/${toolId}/favorite`, {
        method: fav ? "DELETE" : "POST",
      });
      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/catalog/${toolId}`)}`);
        return;
      }
      if (res.ok) setFav((v) => !v);
    } catch {
      // ignore — keep previous state
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-label={fav ? "הסר ממועדפים" : "הוסף למועדפים"}
        aria-pressed={fav}
        className="w-8 h-8 rounded-full bg-bg-surface/90 backdrop-blur flex items-center justify-center shadow disabled:opacity-60"
      >
        <Heart
          className={cn(
            "w-4 h-4 transition-colors",
            fav ? "fill-error text-error" : "text-text-muted"
          )}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-pressed={fav}
      className={cn(
        "h-11 px-4 rounded-xl border-2 font-medium inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60",
        fav
          ? "border-error text-error bg-error/5"
          : "border-primary text-primary"
      )}
    >
      <Heart className={cn("w-4 h-4", fav && "fill-error")} aria-hidden />
      {fav ? "נשמר במועדפים" : "הוסף למועדפים"}
    </button>
  );
}
