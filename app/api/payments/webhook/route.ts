import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  let payload: URLSearchParams;
  try {
    const text = await req.text();
    payload = new URLSearchParams(text);
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  // TODO – verify signature once Cardcom test integration is live.
  // const sig = req.headers.get("x-cardcom-signature");
  // if (!verifyHmac(text, sig, secret)) return 401

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
