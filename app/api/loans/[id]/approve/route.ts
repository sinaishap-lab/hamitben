import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadLoanForManager } from "@/lib/loans";
import { notifyUser } from "@/lib/notifications";
import { formatDateHe } from "@/lib/utils";

export async function PUT(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const r = await loadLoanForManager(params.id);
  if (!r.ok) return NextResponse.json(r.body, { status: r.status });

  if (r.loan.status !== "PENDING") {
    return NextResponse.json(
      { error: "BAD_STATE", message: "ניתן לאשר רק בקשות ממתינות" },
      { status: 409 }
    );
  }

  await prisma.loan.update({
    where: { id: r.loan.id },
    data: { status: "APPROVED" },
  });
  await notifyUser(r.loan.userId, "LOAN_APPROVED", {
    toolName: r.loan.tool.name,
    gemachName: r.loan.tool.gemach.name,
    startDate: formatDateHe(r.loan.startDate),
    endDate: formatDateHe(r.loan.endDate),
    toolId: r.loan.tool.id,
  });
  return NextResponse.json({ ok: true });
}
