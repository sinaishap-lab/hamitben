// Shared payment-provider types. Currency is always ILS.
//
// Receipt issuance is the provider's responsibility — Cardcom's Documents
// add-on creates the קבלה לתרומה (section-46 donation receipt) as part of
// the same charge transaction, returning the doc id + PDF link. Customer
// fields on the *Args types feed straight into that document.

export type ReceiptCustomer = {
  /** Customer display name as it should appear on the document. */
  name: string;
  /** When set, the provider auto-emails the PDF to this address. */
  email?: string | null;
  phone?: string | null;
};

export type IssuedReceiptInfo = {
  /** Provider document id (e.g. Cardcom DocumentNumber). */
  externalDocId: string;
  /** Public PDF link the customer can re-download. */
  externalDocUrl?: string;
};

export type DepositHoldArgs = {
  loanId: string;
  userId: string;
  amount: number;
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
  /** Customer info — Cardcom uses it to issue the donation receipt. */
  customer: ReceiptCustomer;
};

export type ChargeResult = {
  chargeId: string;
  amount: number;
  /** Present when the provider also issued a receipt for this charge. */
  receipt?: IssuedReceiptInfo;
};

export type VoidArgs = {
  /** The chargeId returned from createDepositHold(). */
  chargeId: string;
};

export type CaptureArgs = {
  chargeId: string;
  /** Capture amount may be smaller than original hold (partial capture). */
  amount: number;
  /** Customer info — needed so the provider can issue a receipt for the
   *  capture (overdue / damage settlements). */
  customer: ReceiptCustomer;
  /** Free-text description for the capture receipt. */
  description: string;
};

export type CaptureResult = {
  chargeId: string;
  /** Present when the provider also issued a receipt for the capture. */
  receipt?: IssuedReceiptInfo;
};

export type RefundArgs = {
  chargeId: string;
  amount: number;
};

export interface PaymentProvider {
  readonly name: string;

  createDepositHold(args: DepositHoldArgs): Promise<DepositHoldResult>;
  voidDeposit(args: VoidArgs): Promise<void>;
  captureDeposit(args: CaptureArgs): Promise<CaptureResult>;

  chargeFinal(args: ChargeArgs): Promise<ChargeResult>;
  refund(args: RefundArgs): Promise<{ chargeId: string }>;
}
