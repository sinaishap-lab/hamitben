import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadLoanForManager } from "@/lib/loans";
import { notifyUser } from "@/lib/notifications";
import { formatDateHe } from "@/lib/utils";

// PUT /api/loans/[id]/collect — manager marks the tool as collected
export async function PUT(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const r = await loadLoanForManager(params.id);
  if (!r.ok) return NextResponse.json(r.body, { status: r.status });

  if (r.loan.status !== "APPROVED") {
    return NextResponse.json(
      { error: "BAD_STATE", message: "ניתן לסמן איסוף רק להשאלות שאושרו" },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.loan.update({
      where: { id: r.loan.id },
      data: { status: "ACTIVE" },
    }),
    prisma.tool.update({
      where: { id: r.loan.tool.id },
      data: { status: "LOANED" },
    }),
  ]);
  await notifyUser(r.loan.userId, "LOAN_COLLECTED", {
    toolName: r.loan.tool.name,
    endDate: formatDateHe(r.loan.endDate),
  });
  return NextResponse.json({ ok: true });
}
