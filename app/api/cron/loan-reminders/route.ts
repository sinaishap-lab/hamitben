import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { formatDateHe } from "@/lib/utils";

/**
 * POST /api/cron/loan-reminders
 *
 * Daily job — finds ACTIVE loans whose endDate is "tomorrow" (≤ 36h ahead,
 * ≥ 12h ahead) and fires LOAN_RETURN_REMINDER. Run via Vercel cron:
 *
 *   vercel.json:
 *   {
 *     "crons": [{ "path": "/api/cron/loan-reminders", "schedule": "0 6 * * *" }]
 *   }
 *
 * Authorisation: Vercel sets `Authorization: Bearer <CRON_SECRET>` when
 * `CRON_SECRET` is configured. Local manual invocation can use the same.
 */
export async function POST(req: Request) {
  // Auth — must come from Vercel cron or a trusted caller.
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = req.headers.get("authorization");
    if (got !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
  }

  const now = Date.now();
  const HOUR = 60 * 60 * 1000;
  const from = new Date(now + 12 * HOUR);
  const to = new Date(now + 36 * HOUR);

  const loans = await prisma.loan.findMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: from, lte: to },
    },
    select: {
      id: true,
      userId: true,
      endDate: true,
      tool: { select: { id: true, name: true } },
    },
  });

  let sent = 0;
  for (const loan of loans) {
    await notifyUser(loan.userId, "LOAN_RETURN_REMINDER", {
      toolName: loan.tool.name,
      toolId: loan.tool.id,
      endDate: formatDateHe(loan.endDate),
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}

// Also expose GET so Vercel cron (HTTP GET by default) can hit it.
export const GET = POST;
