"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type BusyRange = { start: string; end: string; status: string };

const HEBREW_WEEKDAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"]; // Sun..Sat
const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function buildGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const firstWeekday = first.getDay();
  const total = daysInMonth(month);
  const cells: Date[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), -i));
  }
  for (let i = 1; i <= total; i++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), i));
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  return cells;
}

function isInBusyRange(day: Date, busy: BusyRange[]): boolean {
  const k = dateKey(day);
  return busy.some((r) => k >= r.start && k <= r.end);
}

const DAY_MS = 24 * 60 * 60 * 1000;

type SelectionProps = {
  /** If true, days are clickable; calls onRangeChange when state updates. */
  selectable?: boolean;
  selectedStart?: string | null;
  selectedEnd?: string | null;
  onRangeChange?: (next: { start: string | null; end: string | null }) => void;
  /** When set, free days are clickable but every click just calls this —
   *  used for guests, to surface a login/register prompt. */
  onGuestClick?: () => void;
};

export function ToolCalendar({
  toolId,
  maxDays,
  selectable = false,
  selectedStart = null,
  selectedEnd = null,
  onRangeChange,
  onGuestClick,
}: { toolId: string; maxDays: number } & SelectionProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayKey = dateKey(today);

  const [month, setMonth] = useState(() => startOfMonth(today));
  const [busy, setBusy] = useState<BusyRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    const from = new Date(month);
    const to = addMonths(month, 1);
    fetch(
      `/api/tools/${toolId}/availability?from=${dateKey(from)}&to=${dateKey(to)}`,
      { signal: ac.signal }
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: { busy: BusyRange[] }) => setBusy(d.busy))
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") return;
        setError("טעינת היומן נכשלה");
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [toolId, month]);

  const grid = useMemo(() => buildGrid(month), [month]);
  const maxFutureMonth = addMonths(today, Math.ceil(maxDays / 30) + 2);

  // Validate proposed range: must be (a) within maxDays, (b) not crossing busy days
  function rangeIsValid(startK: string, endK: string): boolean {
    const start = new Date(startK);
    const end = new Date(endK);
    const days = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
    if (days > maxDays) return false;
    for (let cursor = start; cursor <= end; cursor = new Date(cursor.getTime() + DAY_MS)) {
      if (isInBusyRange(cursor, busy)) return false;
    }
    return true;
  }

  function handleClick(day: Date) {
    // Guest mode: any click on a clickable day surfaces the login prompt.
    if (onGuestClick) {
      onGuestClick();
      return;
    }
    if (!selectable || !onRangeChange) return;
    const k = dateKey(day);
    if (k < todayKey) return;
    if (isInBusyRange(day, busy)) return;

    // First click or restart: set start, clear end
    if (!selectedStart || (selectedStart && selectedEnd) || k < selectedStart) {
      onRangeChange({ start: k, end: null });
      return;
    }
    // Have a start, no end: try to set end
    if (rangeIsValid(selectedStart, k)) {
      onRangeChange({ start: selectedStart, end: k });
    } else {
      // Invalid (too long or crosses busy) → restart from this date
      onRangeChange({ start: k, end: null });
    }
  }

  function isInSelection(k: string): boolean {
    if (!selectedStart) return false;
    if (!selectedEnd) return k === selectedStart;
    return k >= selectedStart && k <= selectedEnd;
  }

  return (
    <div className="bg-bg-surface rounded-2xl border border-primary-100 p-3">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, -1))}
          disabled={month <= startOfMonth(today)}
          aria-label="חודש קודם"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-50 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" aria-hidden />
        </button>
        <div className="font-bold">
          {HEBREW_MONTHS[month.getMonth()]} {month.getFullYear()}
        </div>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          disabled={month >= maxFutureMonth}
          aria-label="חודש הבא"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-50 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-text-muted mb-1">
        {HEBREW_WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-error py-4 text-center">{error}</p>
      ) : (
        <div className="relative grid grid-cols-7 gap-1">
          {loading && (
            <div className="absolute inset-0 bg-bg-surface/60 flex items-center justify-center z-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" aria-hidden />
            </div>
          )}
          {grid.map((day) => {
            const isOtherMonth = day.getMonth() !== month.getMonth();
            const k = dateKey(day);
            const isPast = k < todayKey;
            const isBusy = isInBusyRange(day, busy);
            const isToday = k === todayKey;
            const isFree = !isBusy && !isPast && !isOtherMonth;
            const selected = isInSelection(k);
            const isStartOrEnd =
              selected && (k === selectedStart || k === selectedEnd);

            const clickable = (selectable || !!onGuestClick) && isFree;

            return (
              <button
                key={k}
                type="button"
                disabled={!clickable}
                onClick={() => handleClick(day)}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-md text-xs transition-colors",
                  isOtherMonth && "text-text-muted/40 cursor-default",
                  isPast && !isOtherMonth && "text-text-muted/60 cursor-default",
                  isBusy && !isPast && "bg-error/15 text-error font-bold cursor-not-allowed",
                  isFree && !selected && "bg-success/10 text-success",
                  selected && "bg-primary text-text-inverse font-bold",
                  isStartOrEnd && "ring-2 ring-primary-700",
                  isToday && !selected && "ring-2 ring-primary",
                  clickable && "hover:bg-primary-100 hover:text-primary-700"
                )}
                aria-label={k}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-text-muted mt-3">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-success/40 border border-success" />
          פנוי
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-error/40 border border-error" />
          תפוס
        </span>
        {selectable && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
            נבחר
          </span>
        )}
      </div>
      {selectable && !selectedStart && (
        <p className="text-xs text-text-muted text-center mt-2">
          לחץ על תאריך התחלה ואז על תאריך סיום
        </p>
      )}
      {onGuestClick && (
        <p className="text-xs text-text-muted text-center mt-2">
          לחץ על תאריך כדי לבחור ולבקש השאלה
        </p>
      )}
    </div>
  );
}
