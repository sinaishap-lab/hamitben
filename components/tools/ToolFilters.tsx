"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import type { ToolCategory } from "@prisma/client";
import { TOOL_CATEGORY } from "@/lib/labels";
import { Input } from "@/components/ui/Input";

const CATEGORIES = Object.entries(TOOL_CATEGORY) as [ToolCategory, string][];

function buildUrl(
  pathname: string,
  current: URLSearchParams,
  key: string,
  value: string | null
): string {
  const next = new URLSearchParams(current.toString());
  if (value === null || value === "") next.delete(key);
  else next.set(key, value);
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function ToolFilters({
  gemachs,
}: {
  gemachs: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") || "");
  const activeCategory = params.get("category") || "";
  const activeGemach = params.get("gemach") || "";
  const availableOnly = params.get("available") === "1";

  // Debounce search input → URL update
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = buildUrl(pathname, params, "q", q || null);
      if (next !== `${pathname}?${params.toString()}`) {
        router.replace(next, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      router.replace(buildUrl(pathname, params, key, value), { scroll: false });
    },
    [pathname, params, router]
  );

  const hasActive = q || activeCategory || activeGemach || availableOnly;

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="חיפוש כלי..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pr-9"
        />
      </div>

      {/* Category chips */}
      <div className="-mx-4 px-4 overflow-x-auto scrollbar-thin">
        <div className="flex gap-2 w-max">
          <Chip
            active={!activeCategory}
            onClick={() => updateParam("category", null)}
          >
            כל הקטגוריות
          </Chip>
          {CATEGORIES.map(([key, label]) => (
            <Chip
              key={key}
              active={activeCategory === key}
              onClick={() => updateParam("category", key)}
            >
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Gemach + availability row */}
      <div className="flex gap-2">
        <select
          value={activeGemach}
          onChange={(e) => updateParam("gemach", e.target.value || null)}
          className="flex-1 h-9 px-2 rounded-lg border border-primary-100 bg-bg-surface text-sm"
        >
          <option value="">כל הגמחים</option>
          {gemachs.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm bg-bg-surface border border-primary-100 rounded-lg px-3 h-9">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) =>
              updateParam("available", e.target.checked ? "1" : null)
            }
            className="w-4 h-4 accent-primary"
          />
          פנויים בלבד
        </label>
      </div>

      {hasActive && (
        <button
          type="button"
          onClick={() => router.replace(pathname, { scroll: false })}
          className="self-end text-xs text-primary flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          נקה סינון
        </button>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-3 h-8 rounded-full text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-text-inverse"
          : "bg-bg-surface text-text border border-primary-100"
      }`}
    >
      {children}
    </button>
  );
}
