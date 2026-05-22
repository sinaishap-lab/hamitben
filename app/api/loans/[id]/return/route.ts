import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadLoanForManager } from "@/lib/loans";
import { loanReturnSchema } from "@/lib/validation";
import { notifyNextInWaitlist } from "@/lib/waitlist";
import { getPaymentProvider } from "@/lib/payments";
import { notifyUser } from "@/lib/notifications";

const DAY_MS = 24 * 60 * 60 * 1000;

// PUT /api/loans/[id]/return — manager records the return
// body: { outcome: "OK" | "OVERDUE", notes?: string }
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const r = await loadLoanForManager(params.id);
  if (!r.ok) return NextResponse.json(r.body, { status: r.status });

  if (r.loan.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "BAD_STATE", message: "ניתן לסמן החזרה רק להשאלות פעילות" },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = loanReturnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { outcome, notes } = parsed.data;

  const now = new Date();
  const days = Math.max(
    1,
    Math.ceil((now.getTime() - r.loan.startDate.getTime()) / DAY_MS)
  );
  // Spec §16.2 – 10% off if referral token was consumed at loan creation
  const discountMultiplier = r.loan.referralDiscountApplied ? 0.9 : 1;
  const totalCharged =
    outcome === "OK"
      ? Math.round(r.loan.dailyRate * days * discountMultiplier * 100) / 100
      : null;

  // Payment side-effects BEFORE the DB transaction so we don't end up with
  // RETURNED rows that never actually settled the deposit. If a payment call
  // throws, we abort and leave the loan ACTIVE so the manager can retry.
  const provider = getPaymentProvider();
  let paymentChargeId: string | null = null;

  try {
    if (outcome === "OK") {
      if (r.loan.depositStatus === "HELD" && r.loan.depositChargeId) {
        await provider.voidDeposit({ chargeId: r.loan.depositChargeId });
      }
      if (totalCharged !== null && totalCharged > 0) {
        const final = await provider.chargeFinal({
          loanId: r.loan.id,
          userId: r.loan.userId,
          amount: totalCharged,
          description: `חיוב סופי – ${days} ימי השאלה`,
        });
        paymentChargeId = final.chargeId;
      }
    } else {
      // OVERDUE – capture the held deposit (full amount)
      if (r.loan.depositStatus === "HELD" && r.loan.depositChargeId) {
        const cap = await provider.captureDeposit({
          chargeId: r.loan.depositChargeId,
          amount: r.loan.depositAmount,
        });
        paymentChargeId = cap.chargeId;
      }
    }
  } catch (err) {
    console.error("[loans.return] payment side-effect failed", err);
    return NextResponse.json(
      {
        error: "PAYMENT_FAILED",
        message: "פעולת התשלום נכשלה. אנא נסה שוב.",
      },
      { status: 502 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.loan.update({
      where: { id: r.loan.id },
      data: {
        status: outcome === "OK" ? "RETURNED" : "OVERDUE",
        actualReturnDate: now,
        totalCharged: outcome === "OK" ? totalCharged : r.loan.depositAmount,
        paymentChargeId,
        adminNotes: notes ?? null,
        depositStatus:
          outcome === "OK"
            ? r.loan.depositStatus === "HELD"
              ? "RELEASED"
              : r.loan.depositStatus
            : "CHARGED",
      },
    });
    await tx.tool.update({
      where: { id: r.loan.tool.id },
      data: { status: "AVAILABLE" },
    });
    if (outcome === "OVERDUE") {
      // Spec §3 + §7.6 – auto-ban on overdue/damage
      await tx.user.update({
        where: { id: r.loan.userId },
        data: { isBanned: true, banReason: "החזרת כלי באיחור/בנזק" },
      });
    }
  });

  // Tool is free again → poke the waitlist (spec §20.1)
  await notifyNextInWaitlist(r.loan.tool.id, r.loan.tool.name);

  // Let everyone who favorited the tool know it's available again
  // (excluding the borrower who just returned it).
  const favorites = await prisma.favorite.findMany({
    where: { toolId: r.loan.tool.id, userId: { not: r.loan.userId } },
    select: { userId: true },
  });
  for (const fav of favorites) {
    await notifyUser(fav.userId, "FAVORITE_AVAILABLE", {
      toolName: r.loan.tool.name,
      toolId: r.loan.tool.id,
    });
  }

  await notifyUser(
    r.loan.userId,
    outcome === "OK" ? "LOAN_RETURNED_OK" : "LOAN_OVERDUE",
    {
      toolName: r.loan.tool.name,
      toolId: r.loan.tool.id,
      totalCharged: String(
        outcome === "OK" ? totalCharged ?? 0 : r.loan.depositAmount
      ),
    }
  );

  return NextResponse.json({ ok: true, totalCharged, days });
}
