import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function loadLoan(loanId: string) {
  return prisma.loan.findUnique({
    where: { id: loanId },
    select: {
      id: true,
      status: true,
      depositStatus: true,
      depositChargeId: true,
      paymentChargeId: true,
      startDate: true,
      endDate: true,
      depositAmount: true,
      dailyRate: true,
      userId: true,
      toolId: true,
      referralDiscountApplied: true,
      tool: {
        select: {
          id: true,
          name: true,
          status: true,
          gemach: { select: { id: true, name: true, managerId: true } },
        },
      },
    },
  });
}

type LoanForManager = NonNullable<Awaited<ReturnType<typeof loadLoan>>>;

type ErrorResult = {
  ok: false;
  status: number;
  body: { error: string };
};
type OkResult = {
  ok: true;
  loan: LoanForManager;
};
export type LoanGuardResult = ErrorResult | OkResult;

/**
 * Load a loan and verify the current user has manager-or-admin authority over
 * the gemach that owns the tool. Used by approve/reject/collect/return routes.
 */
export async function loadLoanForManager(
  loanId: string
): Promise<LoanGuardResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, status: 401, body: { error: "UNAUTHORIZED" } };
  }

  const loan = await loadLoan(loanId);
  if (!loan) {
    return { ok: false, status: 404, body: { error: "NOT_FOUND" } };
  }

  const isAdmin = session.user.role === "ADMIN";
  const isManager = loan.tool.gemach.managerId === session.user.id;
  if (!isAdmin && !isManager) {
    return { ok: false, status: 403, body: { error: "FORBIDDEN" } };
  }
  return { ok: true, loan };
}
