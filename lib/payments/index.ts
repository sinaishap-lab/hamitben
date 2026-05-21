import type { PaymentProvider } from "./types";
import { StubPaymentProvider } from "./stub";
import { CardcomPaymentProvider } from "./cardcom";

let cached: PaymentProvider | null = null;

/**
 * Resolve the active payment provider.
 *
 * Picks based on `PAYMENT_PROVIDER`:
 *   - `cardcom` → real Cardcom integration (requires creds)
 *   - anything else / unset → in-memory `stub` (default in dev)
 */
export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;
  const choice = (process.env.PAYMENT_PROVIDER || "stub").toLowerCase();
  cached =
    choice === "cardcom" ? new CardcomPaymentProvider() : new StubPaymentProvider();
  return cached;
}

export type { PaymentProvider } from "./types";
export * from "./types";
