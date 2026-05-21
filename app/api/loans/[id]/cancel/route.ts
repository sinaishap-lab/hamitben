import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/payments";

// PUT /api/loans/[id]/cancel
// User: own loan, only when PENDING.
// Manager (of gemach) or ADMIN: PENDING or APPROVED → CANCELLED.
export async function PUT(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const loan = await prisma.loan.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      userId: true,
      depositStatus: true,
      depositChargeId: true,
      referralDiscountApplied: true,
      tool: { select: { gemach: { select: { managerId: true } } } },
    },
  });
  if (!loan) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = loan.userId === session.user.id;
  const isManager = loan.tool.gemach.managerId === session.user.id;

  // Permission + state guards
  if (isOwner && loan.status !== "PENDING") {
    return NextResponse.json(
      { error: "BAD_STATE", message: "לא ניתן לבטל בקשה לאחר אישור" },
      { status: 409 }
    );
  }
  if (!isOwner && !isManager && !isAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (
    (isManager || isAdmin) &&
    loan.status !== "PENDING" &&
    loan.status !== "APPROVED"
  ) {
    return NextResponse.json(
      { error: "BAD_STATE", message: "ההשאלה כבר נסגרה" },
      { status: 409 }
    );
  }

  // Release the held deposit if any (best-effort — log but don't fail the cancel)
  if (loan.depositStatus === "HELD" && loan.depositChargeId) {
    try {
      await getPaymentProvider().voidDeposit({ chargeId: loan.depositChargeId });
    } catch (err) {
      console.error("[loans.cancel] voidDeposit failed", err);
    }
  }

  // Cancel the loan and refund any consumed discount token in a single tx
  await prisma.$transaction([
    prisma.loan.update({
      where: { id: loan.id },
      data: {
        status: "CANCELLED",
        depositStatus:
          loan.depositStatus === "HELD" ? "RELEASED" : loan.depositStatus,
        referralDiscountApplied: false,
      },
    }),
    ...(loan.referralDiscountApplied
      ? [
          prisma.user.update({
            where: { id: loan.userId },
            data: { discountTokens: { increment: 1 } },
          }),
        ]
      : []),
  ]);

  // TODO (Phase 7): notify the other party
  return NextResponse.json({ ok: true });
}
