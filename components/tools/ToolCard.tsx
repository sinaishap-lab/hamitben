import Link from "next/link";
import Image from "next/image";
import { MapPin, Sprout, Flame, CalendarClock } from "lucide-react";
import type { ToolCategory, ToolStatus } from "@prisma/client";
import { TOOL_CATEGORY, TOOL_STATUS } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { FavoriteButton } from "@/components/tools/FavoriteButton";
import { formatShekel } from "@/lib/utils";

type Props = {
  tool: {
    id: string;
    name: string;
    category: ToolCategory;
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
    <div className="relative">
      <Link
        href={`/catalog/${tool.id}`}
        className="bg-bg-surface rounded-2xl border border-primary-100 overflow-hidden flex flex-col active:scale-[0.98] transition-transform"
      >
        <div className="relative aspect-[4/3] bg-bg">
          {tool.images[0] ? (
            <Image
              src={tool.images[0]}
              alt={tool.name}
              fill
              sizes="(max-width: 480px) 50vw, 240px"
              className="object-cover"
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

        <div className="p-3 flex-1 flex flex-col gap-1">
          <div className="font-bold text-sm leading-tight line-clamp-2">
            {tool.name}
          </div>

          <div className="text-[11px] text-text-muted">
            {TOOL_CATEGORY[tool.category]}
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
            <MapPin className="w-3 h-3" aria-hidden />
            <span className="truncate">{tool.gemach.name}</span>
          </div>

          <div className="text-xs text-text mt-1">
            {tool.dailyRate > 0
              ? formatShekel(tool.dailyRate) + " / יום"
              : "ללא עלות"}
            {tool.depositAmount > 0 && (
              <span className="text-text-muted">
                {" · פיקדון "}
                {formatShekel(tool.depositAmount)}
              </span>
            )}
          </div>

          {!available && nextFreeLabel && (
            <div className="flex items-center gap-1 text-[11px] text-warning font-medium mt-0.5">
              <CalendarClock className="w-3 h-3" aria-hidden />
              {nextFreeLabel}
            </div>
          )}
        </div>
      </Link>

      {/* Favorite heart — sibling of the Link (avoids button-in-anchor) */}
      {favorite !== undefined && (
        <div className="absolute top-2 left-2">
          <FavoriteButton toolId={tool.id} initialFavorite={favorite} compact />
        </div>
      )}
    </div>
  );
}
