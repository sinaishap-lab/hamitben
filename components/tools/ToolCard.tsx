import Link from "next/link";
import Image from "next/image";
import { MapPin, Sprout } from "lucide-react";
import type { ToolCategory, ToolStatus } from "@prisma/client";
import { TOOL_CATEGORY, TOOL_STATUS } from "@/lib/labels";
import { Badge } from "@/components/ui/Badge";
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
};

export function ToolCard({ tool }: Props) {
  const available = tool.status === "AVAILABLE";
  return (
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
        <div className="absolute top-2 right-2">
          <Badge variant={available ? "success" : tool.status === "LOANED" ? "warning" : "neutral"}>
            {TOOL_STATUS[tool.status]}
          </Badge>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col gap-1">
        <div className="font-bold text-sm leading-tight line-clamp-2">
          {tool.name}
        </div>
        <div className="text-[11px] text-text-muted">
          {TOOL_CATEGORY[tool.category]}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-text-muted">
          <MapPin className="w-3 h-3" aria-hidden />
          <span className="truncate">{tool.gemach.name}</span>
        </div>
        <div className="text-xs text-text mt-1">
          {tool.dailyRate > 0 ? formatShekel(tool.dailyRate) + " / יום" : "ללא עלות"}
          {tool.depositAmount > 0 && (
            <span className="text-text-muted">
              {" · פיקדון "}
              {formatShekel(tool.depositAmount)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
