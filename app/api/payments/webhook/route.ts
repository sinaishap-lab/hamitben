import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Verify the HMAC signature Cardcom attaches to webhook payloads.
 * Cardcom's IndicatorUrl callback can be configured to sign the request
 * body with HMAC-SHA256 using the merchant's API password. The hex digest
 * arrives in the X-Cardcom-Signature header. We use timingSafeEqual to
 * avoid leaking validity via response timing.
 */
function verifyHmac(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  // Lengths must match for timingSafeEqual; otherwise it throws.
  if (expected.length !== header.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(header, "hex"));
  } catch {
    return false;
  }
}

/**
 * POST /api/payments/webhook
 *
 * Cardcom IndicatorUrl callback. Body shape varies by API version – v11
 * sends form-urlencoded with ResponseCode/LowProfileCode/ReturnValue.
 *
 * For the stub provider this endpoint is never hit (charges complete inline).
 * When Cardcom is enabled, this is where the deposit-held → APPROVED
 * transition happens.
 */
export async function POST(req: Request) {
  if (process.env.PAYMENT_PROVIDER?.toLowerCase() !== "cardcom") {
    return NextResponse.json({ ok: true, skipped: "stub-mode" });
  }

  const secret = process.env.CARDCOM_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[payments.webhook] CARDCOM_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "MISCONFIGURED" }, { status: 500 });
  }

  let rawBody: string;
  let payload: URLSearchParams;
  try {
    rawBody = await req.text();
    payload = new URLSearchParams(rawBody);
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  // Verify HMAC. Reject anything unsigned or with a bad signature — these
  // could be spoofed status updates that would otherwise flip a loan to HELD
  // without an actual deposit ever being taken.
  const sig = req.headers.get("x-cardcom-signature");
  if (!verifyHmac(rawBody, sig, secret)) {
    console.warn("[payments.webhook] signature verification failed", {
      hasHeader: !!sig,
      bodyLength: rawBody.length,
    });
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  const responseCode = payload.get("ResponseCode");
  const loanId = payload.get("ReturnValue");
  const chargeId = payload.get("LowProfileCode") || payload.get("InternalDealNumber");

  if (!loanId) {
    return NextResponse.json({ error: "MISSING_LOAN_ID" }, { status: 400 });
  }

  if (responseCode !== "0") {
    // Failed – mark loan deposit as NONE (effectively the user has to retry)
    await prisma.loan.update({
      where: { id: loanId },
      data: { depositStatus: "NONE" },
    });
    return NextResponse.json({ ok: true, status: "failed" });
  }

  // Success → flip to HELD and surface charge id
  await prisma.loan.update({
    where: { id: loanId },
    data: { depositStatus: "HELD", depositChargeId: chargeId || undefined },
  });

  // TODO (Phase 7): notify manager (PENDING) or user (APPROVED)
  return NextResponse.json({ ok: true });
}
