import Link from "next/link";
import Image from "next/image";
import { MapPin, Sprout, Flame, CalendarClock } from "lucide-react";
import type { ToolStatus } from "@prisma/client";
import { TOOL_STATUS } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { FavoriteButton } from "@/components/tools/FavoriteButton";
import { formatShekel } from "@/lib/utils";

type Props = {
  tool: {
    id: string;
    name: string;
    category: { name: string };
    images: string[];
    status: ToolStatus;
    depositAmount: number;
    dailyRate: number;
    gemach: { id: string; name: string };
  };
  /** Recently-added → "חדש" badge. */
  isNew?: boolean;
  /** Popular tool (waitlist / many loans) → flame "מבוקש" badge. */
  inDemand?: boolean;
  /** When the tool is busy — e.g. "מתפנה ב-25 במאי". */
  nextFreeLabel?: string;
  /** Average rating + count; omitted if no reviews. */
  rating?: { avg: number; count: number };
  /** Pass a boolean to render the favorite heart (true = already saved). */
  favorite?: boolean;
};

export function ToolCard({
  tool,
  isNew,
  inDemand,
  nextFreeLabel,
  rating,
  favorite,
}: Props) {
  const available = tool.status === "AVAILABLE";

  return (
    <div className="group relative">
      <Link
        href={`/catalog/${tool.id}`}
        className="bg-bg-surface rounded-2xl border border-primary-100/60 overflow-hidden flex flex-col shadow-card hover:shadow-glow transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:shadow-card"
      >
        <div className="relative aspect-[4/3] bg-primary-50 overflow-hidden">
          {tool.images[0] ? (
            <Image
              src={tool.images[0]}
              alt={tool.name}
              fill
              sizes="(max-width: 480px) 50vw, 240px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary-200">
              <Sprout className="w-12 h-12" aria-hidden />
            </div>
          )}

          {/* Status — top-right */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={
                available
                  ? "success"
                  : tool.status === "LOANED"
                    ? "warning"
                    : "neutral"
              }
            >
              {TOOL_STATUS[tool.status]}
            </Badge>
          </div>

          {/* New / in-demand — bottom-right over the image */}
          <div className="absolute bottom-2 right-2 flex gap-1">
            {isNew && <Badge variant="accent">חדש</Badge>}
            {inDemand && (
              <Badge variant="error">
                <Flame className="w-3 h-3 inline -mt-0.5" aria-hidden /> מבוקש
              </Badge>
            )}
          </div>
        </div>

        <div className="p-3.5 flex-1 flex flex-col gap-1.5">
          {/* Category label — small, primary-tinted */}
          <div className="text-[10px] font-semibold text-primary/70 leading-none tracking-wide">
            {tool.category.name}
          </div>

          <div className="font-bold text-[15px] leading-snug line-clamp-2 text-text">
            {tool.name}
          </div>

          {rating && rating.count > 0 && (
            <div className="flex items-center gap-1">
              <ReviewStars rating={rating.avg} size={12} />
              <span className="text-[11px] text-text-muted">
                ({rating.count})
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 text-[11px] text-text-muted">
            <MapPin className="w-3 h-3 shrink-0" aria-hidden />
            <span className="truncate">{tool.gemach.name}</span>
          </div>

          {/* Price footer */}
          <div className="mt-1.5 pt-2.5 border-t border-primary-50 flex items-baseline justify-between gap-1">
            {tool.dailyRate > 0 ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-primary">
                    {formatShekel(tool.dailyRate)}
                  </span>
                  <span className="text-[10px] text-text-muted">/ יום</span>
                </div>
                {tool.depositAmount > 0 && (
                  <span className="text-[10px] text-text-muted truncate">
                    פיקדון {formatShekel(tool.depositAmount)}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs font-semibold text-success">
                ללא עלות
              </span>
            )}
          </div>

          {!available && nextFreeLabel && (
            <div className="flex items-center gap-1 text-[11px] text-warning font-medium">
              <CalendarClock className="w-3 h-3 shrink-0" aria-hidden />
              {nextFreeLabel}
            </div>
          )}
        </div>
      </Link>

      {/* Favorite heart — sibling of the Link (avoids button-in-anchor) */}
      {favorite !== undefined && (
        <div className="absolute top-2 left-2 z-10">
          <FavoriteButton toolId={tool.id} initialFavorite={favorite} compact />
        </div>
      )}
    </div>
  );
}
