import { randomBytes } from "node:crypto";
import type {
  CaptureArgs,
  CaptureResult,
  ChargeArgs,
  ChargeResult,
  DepositHoldArgs,
  DepositHoldResult,
  IssuedReceiptInfo,
  PaymentProvider,
  RefundArgs,
  VoidArgs,
} from "./types";

/**
 * In-memory payment provider that always succeeds. Used in dev/test and any
 * environment where Cardcom credentials aren't configured. Generates
 * pseudo-random IDs so downstream code can store them like real refs, and
 * returns a fake receipt info object so the caller can persist a Receipt
 * row identical in shape to the real Cardcom flow.
 */
function fakeId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

function fakeReceipt(): IssuedReceiptInfo {
  return {
    externalDocId: fakeId("doc"),
    // No real PDF in stub mode — left undefined so the UI can show
    // "in stub mode" instead of a broken link.
    externalDocUrl: undefined,
  };
}

export class StubPaymentProvider implements PaymentProvider {
  readonly name = "stub";

  async createDepositHold(_args: DepositHoldArgs): Promise<DepositHoldResult> {
    return { kind: "immediate", chargeId: fakeId("hold") };
  }

  async voidDeposit(_args: VoidArgs): Promise<void> {
    // no-op
  }

  async captureDeposit(_args: CaptureArgs): Promise<CaptureResult> {
    return { chargeId: fakeId("capture"), receipt: fakeReceipt() };
  }

  async chargeFinal(args: ChargeArgs): Promise<ChargeResult> {
    return {
      chargeId: fakeId("charge"),
      amount: args.amount,
      receipt: fakeReceipt(),
    };
  }

  async refund(_args: RefundArgs): Promise<{ chargeId: string }> {
    return { chargeId: fakeId("refund") };
  }
}
