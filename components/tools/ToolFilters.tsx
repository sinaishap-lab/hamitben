"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, LayoutGrid, type LucideIcon } from "lucide-react";
import { useCallback, useState, useEffect, type ReactNode } from "react";
import { getCategoryIcon } from "@/lib/category-icons";
import { Input } from "@/components/ui/Input";

const AVAIL_OPTIONS = [
  { key: "", label: "הכל" },
  { key: "today", label: "פנוי היום" },
  { key: "tomorrow", label: "פנוי מחר" },
] as const;

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
  categories,
}: {
  gemachs: { id: string; name: string }[];
  categories: { id: string; name: string; icon: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") || "");
  const activeCategory = params.get("category") || "";
  const activeGemach = params.get("gemach") || "";
  const activeAvail = params.get("avail") || "";

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

  const hasActive = q || activeCategory || activeGemach || activeAvail;

  return (
    <div className="flex flex-col gap-4">
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

      {/* 1 — Category: wrapping chips, no horizontal scroll */}
      <FilterSection label="לפי קטגוריה">
        <div className="flex flex-wrap gap-2">
          <Chip
            active={!activeCategory}
            onClick={() => updateParam("category", null)}
            icon={LayoutGrid}
          >
            הכל
          </Chip>
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              active={activeCategory === cat.id}
              onClick={() => updateParam("category", cat.id)}
              icon={getCategoryIcon(cat.icon)}
            >
              {cat.name}
            </Chip>
          ))}
        </div>
      </FilterSection>

      {/* 2 — Availability (today / tomorrow) */}
      <FilterSection label="לפי זמינות">
        <div className="flex flex-wrap gap-2">
          {AVAIL_OPTIONS.map((opt) => (
            <Chip
              key={opt.key}
              active={activeAvail === opt.key}
              onClick={() => updateParam("avail", opt.key || null)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </FilterSection>

      {/* 3 — Gemach */}
      <FilterSection label="לפי גמח">
        <select
          value={activeGemach}
          onChange={(e) => updateParam("gemach", e.target.value || null)}
          className="w-full h-10 px-2 rounded-lg border border-primary-100 bg-bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        >
          <option value="">כל הגמחים</option>
          {gemachs.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </FilterSection>

      {hasActive && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.replace(pathname, { scroll: false });
          }}
          className="self-end text-xs text-primary flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          נקה סינון
        </button>
      )}
    </div>
  );
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full text-[13px] font-medium transition-all duration-200 ${
        active
          ? "bg-gradient-primary text-text-inverse shadow-soft hover:shadow-glow border border-primary-700"
          : "bg-bg-surface text-text border border-primary-100 hover:border-primary-300 hover:bg-primary-50/40"
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />}
      {children}
    </button>
  );
}
