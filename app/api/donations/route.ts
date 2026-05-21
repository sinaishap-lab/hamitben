import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { donationSchema } from "@/lib/validation";
import { getPaymentProvider } from "@/lib/payments";

// POST /api/donations — one-time charge via PaymentProvider.
// In stub mode the donation is recorded as COMPLETED immediately.
// In Cardcom mode we redirect the user to the hosted page (TODO).
export async function POST(req: Request) {
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

  try {
    const result = await getPaymentProvider().chargeFinal({
      loanId: donation.id, // re-using arg as opaque ref
      userId: name ?? "anonymous-donor",
      amount,
      description: `תרומה למתבן`,
    });
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: "COMPLETED", chargeId: result.chargeId },
    });
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
