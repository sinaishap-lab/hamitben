import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toDateOnly(d: Date): string {
  // Use local server time which on Vercel is UTC; Israel is UTC+2/+3.
  // For day-level resolution we keep it simple — the client renders by its own TZ.
  return d.toISOString().slice(0, 10);
}

// GET /api/tools/[id]/availability — returns busy date ranges (APPROVED + ACTIVE loans)
// Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD limits the window.
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const from = fromStr ? new Date(fromStr) : new Date();
  const to = toStr ? new Date(toStr) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);

  const loans = await prisma.loan.findMany({
    where: {
      toolId: params.id,
      status: { in: ["APPROVED", "ACTIVE"] },
      // Any overlap with [from, to]
      AND: [{ startDate: { lte: to } }, { endDate: { gte: from } }],
    },
    orderBy: { startDate: "asc" },
    select: { startDate: true, endDate: true, status: true },
  });

  return NextResponse.json({
    busy: loans.map((l) => ({
      start: toDateOnly(l.startDate),
      end: toDateOnly(l.endDate),
      status: l.status,
    })),
  });
}
