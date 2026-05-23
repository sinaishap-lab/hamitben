import { NextResponse } from "next/server";
import { Prisma, type LoanStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { loanCreateSchema } from "@/lib/validation";
import { getPaymentProvider } from "@/lib/payments";
import type { DepositHoldResult } from "@/lib/payments";
import { notifyUser } from "@/lib/notifications";
import { formatDateHe } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// GET /api/loans — own loans by default, manager sees gemach loans with ?gemachId
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const gemachId = url.searchParams.get("gemachId");
  const status = url.searchParams.get("status");

  const where: Prisma.LoanWhereInput = {};

  if (gemachId) {
    // Manager scope: must own the gemach or be admin
    const gemach = await prisma.gemach.findUnique({
      where: { id: gemachId },
      select: { managerId: true },
    });
    if (!gemach) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const isAdmin = session.user.role === "ADMIN";
    const isOwner = gemach.managerId === session.user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    where.tool = { gemachId };
  } else {
    where.userId = session.user.id;
  }

  if (status) {
    where.status = status as LoanStatus;
  }

  const loans = await prisma.loan.findMany({
    where,
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
    select: {
      id: true,
      status: true,
      depositStatus: true,
      startDate: true,
      endDate: true,
      actualReturnDate: true,
      purpose: true,
      depositAmount: true,
      dailyRate: true,
      totalCharged: true,
      adminNotes: true,
      createdAt: true,
      tool: {
        select: {
          id: true,
          name: true,
          images: true,
          category: { select: { name: true } },
          gemach: { select: { id: true, name: true } },
        },
      },
      user: { select: { id: true, name: true, phone: true } },
    },
  });
  return NextResponse.json({ loans });
}

// POST /api/loans — create a loan request
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (session.user.status !== "APPROVED") {
    return NextResponse.json(
      { error: "NOT_APPROVED", message: "חשבונך לא אושר עדיין" },
      { status: 403 }
    );
  }
  if (session.user.isBanned) {
    return NextResponse.json(
      { error: "BANNED", message: "חשבונך חסום מהשאלות" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = loanCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { toolId, purpose, useDiscountToken } = parsed.data;
  const startDate = startOfDay(parsed.data.startDate);
  const endDate = startOfDay(parsed.data.endDate);
  const today = startOfDay(new Date());

  if (startDate < today) {
    return NextResponse.json(
      {
        error: "VALIDATION",
        issues: { startDate: ["תאריך ההתחלה חייב להיות היום או בעתיד"] },
      },
      { status: 400 }
    );
  }

  const tool = await prisma.tool.findFirst({
    where: { id: toolId, isActive: true },
    select: {
      id: true,
      name: true,
      maxDays: true,
      depositAmount: true,
      dailyRate: true,
      autoApprove: true,
      status: true,
      gemach: {
        select: { id: true, name: true, managerId: true },
      },
    },
  });
  if (!tool) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "הכלי לא נמצא" },
      { status: 404 }
    );
  }

  const days = Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS) + 1;
  if (days > tool.maxDays) {
    return NextResponse.json(
      {
        error: "VALIDATION",
        issues: {
          endDate: [`ניתן להשאיל עד ${tool.maxDays} ימים`],
        },
      },
      { status: 400 }
    );
  }

  // Conflict check – no overlap with PENDING/APPROVED/ACTIVE on same tool
  const conflict = await prisma.loan.findFirst({
    where: {
      toolId: tool.id,
      status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
      AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
    },
    select: { id: true },
  });
  if (conflict) {
    return NextResponse.json(
      {
        error: "CONFLICT",
        message: "התאריכים שבחרת כבר תפוסים. בחר טווח אחר.",
      },
      { status: 409 }
    );
  }

  // Track whether this is the user's first loan – drives referral bonus
  const existingLoansCount = await prisma.loan.count({
    where: { userId: session.user.id },
  });

  // Optionally consume a discount token (§16.2). Atomic with the loan
  // insert so we never end up with a decremented balance but no loan.
  let referralDiscountApplied = false;
  if (useDiscountToken) {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { discountTokens: true },
    });
    if ((currentUser?.discountTokens ?? 0) > 0) {
      referralDiscountApplied = true;
    }
  }

  let loan: { id: string; status: LoanStatus };
  try {
    if (referralDiscountApplied) {
      const [, created] = await prisma.$transaction([
        prisma.user.update({
          where: { id: session.user.id },
          data: { discountTokens: { decrement: 1 } },
        }),
        prisma.loan.create({
          data: {
            toolId: tool.id,
            userId: session.user.id,
            startDate,
            endDate,
            purpose: purpose ?? null,
            depositAmount: tool.depositAmount,
            dailyRate: tool.dailyRate,
            status: "PENDING",
            termsAcknowledgedAt: new Date(),
            referralDiscountApplied: true,
          },
          select: { id: true, status: true },
        }),
      ]);
      loan = created;
    } else {
      loan = await prisma.loan.create({
        data: {
          toolId: tool.id,
          userId: session.user.id,
          startDate,
          endDate,
          purpose: purpose ?? null,
          depositAmount: tool.depositAmount,
          dailyRate: tool.dailyRate,
          // Created PENDING regardless of autoApprove — promoted to APPROVED
          // only after deposit is HELD (immediate stub) or webhook fires.
          status: "PENDING",
          termsAcknowledgedAt: new Date(),
        },
        select: { id: true, status: true },
      });
    }
  } catch (err) {
    console.error("[loans.POST] insert failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }

  // Deposit hold (skip if amount == 0 — free tools)
  let holdResult: DepositHoldResult | null = null;
  if (tool.depositAmount > 0) {
    try {
      const provider = getPaymentProvider();
      holdResult = await provider.createDepositHold({
        loanId: loan.id,
        userId: session.user.id,
        amount: tool.depositAmount,
        description: `פיקדון – השאלת כלי`,
      });
    } catch (err) {
      console.error("[loans.POST] deposit hold failed", err);
      // Roll back the loan so the user can retry cleanly.
      await prisma.loan.delete({ where: { id: loan.id } });
      return NextResponse.json(
        {
          error: "PAYMENT_FAILED",
          message: "נעילת הפיקדון נכשלה. נסה שוב.",
        },
        { status: 402 }
      );
    }
  }

  // Immediate-mode providers (e.g. stub) finalise the loan in one step.
  // Redirect-mode (Cardcom) defers HELD/APPROVED until the webhook fires.
  if (!holdResult || holdResult.kind === "immediate") {
    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        depositStatus: holdResult ? "HELD" : "NONE",
        depositChargeId: holdResult?.chargeId,
        status: tool.autoApprove ? "APPROVED" : "PENDING",
      },
    });
    loan = {
      ...loan,
      status: tool.autoApprove ? "APPROVED" : "PENDING",
    };
  } else {
    // redirect mode
    await prisma.loan.update({
      where: { id: loan.id },
      data: { depositChargeId: holdResult.externalId },
    });
  }

  // Award the referrer if this was the user's first loan request (spec §16.2).
  if (existingLoansCount === 0) {
    const userMeta = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referredById: true },
    });
    if (userMeta?.referredById) {
      await prisma.user.update({
        where: { id: userMeta.referredById },
        data: { discountTokens: { increment: 1 } },
      });
    }
  }

  // Send notifications based on the final loan state
  const notifyData = {
    loanId: loan.id,
    toolId: tool.id,
    toolName: tool.name,
    gemachId: tool.gemach.id,
    gemachName: tool.gemach.name,
    userName: session.user.name ?? "",
    startDate: formatDateHe(startDate),
    endDate: formatDateHe(endDate),
  };
  if (loan.status === "APPROVED") {
    // Auto-approved → notify the borrower
    await notifyUser(session.user.id, "LOAN_APPROVED", notifyData);
  } else if (loan.status === "PENDING" && holdResult?.kind !== "redirect") {
    // Awaiting manager approval (and the deposit is already in flight or moot)
    await notifyUser(tool.gemach.managerId, "LOAN_REQUESTED", notifyData);
  }

  if (holdResult?.kind === "redirect") {
    return NextResponse.json(
      { ok: true, loan, redirectUrl: holdResult.url },
      { status: 201 }
    );
  }
  return NextResponse.json({ ok: true, loan }, { status: 201 });
}
