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

// Build a 6×7 grid (RTL: column 0 = Sunday on the right)
function buildGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const firstWeekday = first.getDay(); // 0..6 (Sun..Sat)
  const total = daysInMonth(month);
  const cells: Date[] = [];

  // Leading days from previous month
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), -i));
  }
  // Current month days
  for (let i = 1; i <= total; i++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), i));
  }
  // Trailing days from next month
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  // Pad to 6 rows for height stability
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

export function ToolCalendar({ toolId, maxDays }: { toolId: string; maxDays: number }) {
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

  return (
    <div className="bg-bg-surface rounded-2xl border border-primary-100 p-3">
      {/* Header */}
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

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-text-muted mb-1">
        {HEBREW_WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
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
            return (
              <div
                key={k}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-md text-xs",
                  isOtherMonth && "text-text-muted/40",
                  isPast && !isOtherMonth && "text-text-muted/60",
                  isBusy && !isPast && "bg-error/15 text-error font-bold",
                  !isBusy && !isPast && !isOtherMonth && "bg-success/10 text-success",
                  isToday && "ring-2 ring-primary"
                )}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center gap-4 text-[11px] text-text-muted mt-3">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-success/40 border border-success" />
          פנוי
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-error/40 border border-error" />
          תפוס
        </span>
      </div>
    </div>
  );
}
