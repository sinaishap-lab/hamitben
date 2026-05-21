// Shared payment-provider types. Currency is always ILS.

export type DepositHoldArgs = {
  loanId: string;
  userId: string;
  amount: number; // ILS, integer agorot? No — keep as float; provider will round.
  description: string;
};

export type DepositHoldResult =
  | {
      kind: "immediate";
      /** Provider-specific reference for the held funds. */
      chargeId: string;
    }
  | {
      kind: "redirect";
      /** URL to redirect the customer to in order to complete the hold. */
      url: string;
      /** Provider-specific reference, useful to look up the loan from a webhook. */
      externalId: string;
    };

export type ChargeArgs = {
  loanId: string;
  userId: string;
  amount: number;
  description: string;
};

export type ChargeResult = {
  chargeId: string;
  amount: number;
};

export type VoidArgs = {
  /** The chargeId returned from createDepositHold(). */
  chargeId: string;
};

export type CaptureArgs = {
  chargeId: string;
  /** Capture amount may be smaller than original hold (partial capture). */
  amount: number;
};

export type RefundArgs = {
  chargeId: string;
  amount: number;
};

export interface PaymentProvider {
  readonly name: string;

  createDepositHold(args: DepositHoldArgs): Promise<DepositHoldResult>;
  voidDeposit(args: VoidArgs): Promise<void>;
  captureDeposit(args: CaptureArgs): Promise<{ chargeId: string }>;

  chargeFinal(args: ChargeArgs): Promise<ChargeResult>;
  refund(args: RefundArgs): Promise<{ chargeId: string }>;
}
