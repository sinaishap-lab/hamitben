import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { donationSchema } from "@/lib/validation";
import { getPaymentProvider } from "@/lib/payments";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/donations — one-time charge via PaymentProvider.
// In stub mode the donation is recorded as COMPLETED immediately.
// In Cardcom mode we redirect the user to the hosted page (TODO).
export async function POST(req: Request) {
  // Endpoint is public (guests can donate) — rate-limit by IP to prevent
  // abuse. 5 requests / minute is plenty for a real human filling the form.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`donations:${ip}`, {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: "יותר מדי בקשות. נסה שוב בעוד רגע.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = donationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { amount, name, email } = parsed.data;

  const donation = await prisma.donation.create({
    data: {
      amount,
      name: name ?? null,
      email: email ?? null,
    },
    select: { id: true },
  });

  const donorName = name ?? "תורם/ת אנונימי/ת";
  const description = "תרומה לקרן ציון לפיתוח חקלאות, התיישבות וקהילה";

  try {
    const result = await getPaymentProvider().chargeFinal({
      loanId: donation.id, // re-using arg as opaque ref
      userId: name ?? "anonymous-donor",
      amount,
      description,
      customer: {
        name: donorName,
        email: email ?? null,
        phone: null,
      },
    });
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: "COMPLETED", chargeId: result.chargeId },
    });

    // Persist the receipt the provider issued in the same charge call.
    // Best-effort — a failure here doesn't fail the donation (the charge
    // already settled and the PDF was already emailed by Cardcom).
    if (result.receipt) {
      try {
        await prisma.receipt.create({
          data: {
            amount,
            customerName: donorName,
            customerEmail: email ?? null,
            customerPhone: null,
            description,
            status: "ISSUED",
            issuedAt: new Date(),
            externalDocId: result.receipt.externalDocId,
            externalDocUrl: result.receipt.externalDocUrl,
            donationId: donation.id,
          },
        });
      } catch (err) {
        console.error(
          "[donations.POST] receipt persistence failed (donation already charged)",
          err
        );
      }
    }

    return NextResponse.json(
      { ok: true, id: donation.id, chargeId: result.chargeId },
      { status: 201 }
    );
  } catch (err) {
    console.error("[donations.POST] charge failed", err);
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "PAYMENT_FAILED", message: "החיוב נכשל. נסה שוב." },
      { status: 402 }
    );
  }
}
