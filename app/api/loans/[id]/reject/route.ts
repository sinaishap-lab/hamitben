import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadLoanForManager } from "@/lib/loans";
import { loanRejectSchema } from "@/lib/validation";
import { getPaymentProvider } from "@/lib/payments";
import { notifyUser } from "@/lib/notifications";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const r = await loadLoanForManager(params.id);
  if (!r.ok) return NextResponse.json(r.body, { status: r.status });

  if (r.loan.status !== "PENDING") {
    return NextResponse.json(
      { error: "BAD_STATE", message: "ניתן לדחות רק בקשות ממתינות" },
      { status: 409 }
    );
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    /* empty body OK */
  }
  const parsed = loanRejectSchema.safeParse(body);
  const reason = parsed.success ? parsed.data.reason : null;

  if (r.loan.depositStatus === "HELD" && r.loan.depositChargeId) {
    try {
      await getPaymentProvider().voidDeposit({ chargeId: r.loan.depositChargeId });
    } catch (err) {
      console.error("[loans.reject] voidDeposit failed", err);
    }
  }

  // Reject the loan and refund any consumed discount token
  await prisma.$transaction([
    prisma.loan.update({
      where: { id: r.loan.id },
      data: {
        status: "REJECTED",
        adminNotes: reason ?? null,
        depositStatus:
          r.loan.depositStatus === "HELD" ? "RELEASED" : r.loan.depositStatus,
        referralDiscountApplied: false,
      },
    }),
    ...(r.loan.referralDiscountApplied
      ? [
          prisma.user.update({
            where: { id: r.loan.userId },
            data: { discountTokens: { increment: 1 } },
          }),
        ]
      : []),
  ]);

  await notifyUser(r.loan.userId, "LOAN_REJECTED", {
    toolName: r.loan.tool.name,
    reason: reason ?? "",
  });
  return NextResponse.json({ ok: true });
}
