// Simple in-memory sliding-window rate limiter. Good enough to swat the
// common abuse cases (script-kiddie spam, accidental retry loops) on public
// endpoints. NOT a hardened defense — on Vercel each serverless instance
// has its own counter, so an attacker hitting the same endpoint repeatedly
// will fan out across instances and effectively get N× the budget. For
// production-grade limits, swap in Upstash / Redis-backed counters.

type RateLimitOptions = {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed inside the window. */
  maxRequests: number;
};

type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number };

const buckets = new Map<string, number[]>();

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const events = (buckets.get(identifier) ?? []).filter((t) => t >= windowStart);

  if (events.length >= options.maxRequests) {
    const oldest = events[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));
    return { ok: false, retryAfter };
  }

  events.push(now);
  buckets.set(identifier, events);

  // Lazy housekeeping — ~1% of the time, prune empty buckets so memory
  // doesn't grow unboundedly in long-lived instances.
  if (Math.random() < 0.01) {
    buckets.forEach((ts: number[], key: string) => {
      const stillRecent = ts.filter((t) => t >= windowStart);
      if (stillRecent.length === 0) buckets.delete(key);
      else buckets.set(key, stillRecent);
    });
  }

  return { ok: true };
}

/** Best-effort client-IP extraction. Vercel sets `x-forwarded-for`. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
