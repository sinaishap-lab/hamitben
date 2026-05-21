import { randomBytes } from "node:crypto";
import type {
  CaptureArgs,
  ChargeArgs,
  ChargeResult,
  DepositHoldArgs,
  DepositHoldResult,
  PaymentProvider,
  RefundArgs,
  VoidArgs,
} from "./types";

/**
 * In-memory payment provider that always succeeds. Used in dev/test and any
 * environment where Cardcom credentials aren't configured. Generates
 * pseudo-random IDs so downstream code can store them like real refs.
 */
function fakeId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export class StubPaymentProvider implements PaymentProvider {
  readonly name = "stub";

  async createDepositHold(_args: DepositHoldArgs): Promise<DepositHoldResult> {
    return { kind: "immediate", chargeId: fakeId("hold") };
  }

  async voidDeposit(_args: VoidArgs): Promise<void> {
    // no-op
  }

  async captureDeposit(_args: CaptureArgs): Promise<{ chargeId: string }> {
    return { chargeId: fakeId("capture") };
  }

  async chargeFinal(args: ChargeArgs): Promise<ChargeResult> {
    return { chargeId: fakeId("charge"), amount: args.amount };
  }

  async refund(_args: RefundArgs): Promise<{ chargeId: string }> {
    return { chargeId: fakeId("refund") };
  }
}
