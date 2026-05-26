import type {
  CaptureArgs,
  CaptureResult,
  ChargeArgs,
  ChargeResult,
  DepositHoldArgs,
  DepositHoldResult,
  PaymentProvider,
  RefundArgs,
  VoidArgs,
} from "./types";

/**
 * Cardcom (Israeli) payment provider. Skeleton — wire up the real calls once
 * the merchant account is approved.
 *
 * Cardcom flow:
 *   - Deposit hold: Lowprofile "J2" pre-authorization. Either inline server-
 *     to-server (requires PCI compliance + tokenized card) OR redirect to a
 *     hosted page (recommended; returns to /api/payments/webhook).
 *   - Capture / Void: server-to-server REST.
 *   - Final charge: server-to-server using the stored token.
 *
 * Receipt issuance is bundled into the same Cardcom call via the Cardcom
 * Documents add-on (CreateInvoice / DocumentToCreate params). The donor
 * gets a "קבלה לתרומה" (section 46) PDF emailed automatically; the API
 * returns DocumentNumber + DocumentUrl which we surface as `receipt` on
 * the result so the route handler can persist a Receipt row.
 *
 * API docs: https://kb.cardcom.solutions/article/AA-01416
 */
export class CardcomPaymentProvider implements PaymentProvider {
  readonly name = "cardcom";

  private readonly terminal: string;
  private readonly username: string;
  private readonly apiName: string;
  // Cardcom v11 endpoint — kept for documentation; uncomment when fetch lands.
  // private readonly baseUrl = "https://secure.cardcom.solutions/api/v11";

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const terminal = env.CARDCOM_TERMINAL;
    const username = env.CARDCOM_USERNAME;
    const apiName = env.CARDCOM_API_NAME;
    if (!terminal || !username || !apiName) {
      throw new Error(
        "Cardcom not configured – set CARDCOM_TERMINAL, CARDCOM_USERNAME, CARDCOM_API_NAME"
      );
    }
    this.terminal = terminal;
    this.username = username;
    this.apiName = apiName;
  }

  async createDepositHold(args: DepositHoldArgs): Promise<DepositHoldResult> {
    // Lowprofile.Create.aspx with Operation=2 (J2 / pre-auth).
    // Returns LowProfileCode + URL → redirect the customer.
    const successUrl = `${process.env.NEXTAUTH_URL}/loans/payment-return?loanId=${encodeURIComponent(args.loanId)}`;
    const _params = new URLSearchParams({
      TerminalNumber: this.terminal,
      UserName: this.username,
      APILevel: "10",
      codepage: "65001",
      Operation: "2", // J2 – pre-auth
      Sum: args.amount.toFixed(2),
      ProductName: args.description,
      ReturnValue: args.loanId, // echoed back in webhook
      SuccessRedirectUrl: successUrl,
      FailedRedirectUrl: `${process.env.NEXTAUTH_URL}/loans/payment-return?error=1`,
      IndicatorUrl: `${process.env.NEXTAUTH_URL}/api/payments/webhook`,
      Language: "he",
      CoinID: "1", // ILS
    });
    void this.apiName; // referenced once creds land; silence unused-prop warning
    void _params;

    // TODO: switch to real fetch once production creds land.
    // const res = await fetch(`${this.baseUrl}/LowProfile/Create`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/x-www-form-urlencoded" },
    //   body: _params.toString(),
    // });
    // const text = await res.text();
    // const parsed = new URLSearchParams(text);
    // const code = parsed.get("ResponseCode");
    // if (code !== "0") throw new Error(`Cardcom hold failed: ${text}`);
    // const lowProfileCode = parsed.get("LowProfileCode");
    // const url = parsed.get("url");
    // return { kind: "redirect", url, externalId: lowProfileCode };

    throw new Error(
      "CardcomPaymentProvider.createDepositHold not yet implemented – currently stub-only"
    );
  }

  async voidDeposit(_args: VoidArgs): Promise<void> {
    // CancelDeal.aspx with the LowProfile token. Idempotent if deal is already
    // voided; treat 0 + "Ok" as success.
    throw new Error("CardcomPaymentProvider.voidDeposit not yet implemented");
  }

  async captureDeposit(_args: CaptureArgs): Promise<CaptureResult> {
    // ChargeIdentityNumber.aspx or DealInformation flow — capture from
    // pre-auth into a real charge. Include the Documents block (see
    // chargeFinal below) so a "קבלה לתרומה" is issued in the same call,
    // emailed to _args.customer.email, and returned as `receipt`.
    throw new Error("CardcomPaymentProvider.captureDeposit not yet implemented");
  }

  async chargeFinal(_args: ChargeArgs): Promise<ChargeResult> {
    // Direct charge via stored token (after first transaction).
    //
    // Embed the Documents (Receipt) section in the same request:
    //   DocumentToCreate          = "5"   ← Receipt for donation (קבלה לתרומה)
    //   IsCreateInvoice           = "true"
    //   InvoiceHead.CustName      = _args.customer.name
    //   InvoiceHead.SendByEmail   = _args.customer.email ? "true" : "false"
    //   InvoiceHead.Email         = _args.customer.email
    //   InvoiceHead.Language      = "he"
    //   InvoiceLines1.Description = _args.description
    //   InvoiceLines1.Price       = _args.amount.toFixed(2)
    //   InvoiceLines1.Quantity    = "1"
    //
    // Response includes DocumentNumber + DocumentLink → return them as
    // `receipt: { externalDocId, externalDocUrl }`.
    throw new Error("CardcomPaymentProvider.chargeFinal not yet implemented");
  }

  async refund(_args: RefundArgs): Promise<{ chargeId: string }> {
    // CancelDeal or RefundDeal depending on age.
    throw new Error("CardcomPaymentProvider.refund not yet implemented");
  }
}
