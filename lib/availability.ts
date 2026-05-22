// Availability helpers shared by the catalog + tool pages.

const DAY_MS = 24 * 60 * 60 * 1000;

export type BusyRange = { startDate: Date; endDate: Date };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * The first day (start-of-day) on or after `from` that is NOT covered by any
 * busy range. Used to tell a borrower when a loaned tool frees up.
 * Returns `from` itself if the tool is already free.
 */
export function computeNextFree(busy: BusyRange[], from: Date = new Date()): Date {
  let cursor = startOfDay(from);
  if (busy.length === 0) return cursor;

  const ranges = busy
    .map((r) => ({ start: startOfDay(r.startDate), end: startOfDay(r.endDate) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  let advanced = true;
  while (advanced) {
    advanced = false;
    for (const r of ranges) {
      if (cursor >= r.start && cursor <= r.end) {
        cursor = new Date(r.end.getTime() + DAY_MS);
        advanced = true;
      }
    }
  }
  return cursor;
}

/** Is the tool free on `day` given its busy ranges? */
export function isFreeOn(busy: BusyRange[], day: Date): boolean {
  const d = startOfDay(day);
  return !busy.some(
    (r) => d >= startOfDay(r.startDate) && d <= startOfDay(r.endDate)
  );
}
