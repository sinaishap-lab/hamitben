import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { reviewCreateSchema } from "@/lib/validation";

// GET /api/reviews?toolId=... — public list of a tool's reviews
export async function GET(req: Request) {
  const url = new URL(req.url);
  const toolId = url.searchParams.get("toolId");
  if (!toolId) {
    return NextResponse.json({ error: "MISSING_TOOL_ID" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { toolId, type: "TOOL" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });
  return NextResponse.json({ reviews });
}

// POST /api/reviews — create a TOOL review.
// Only borrowers who actually completed a loan for the tool may review,
// and only once (spec §8.4 — verified reviews).
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = reviewCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { toolId, rating, comment } = parsed.data;

  // Verified-borrower check: the user must have a finished loan for this tool.
  const completedLoan = await prisma.loan.findFirst({
    where: {
      toolId,
      userId: session.user.id,
      status: { in: ["RETURNED", "OVERDUE"] },
    },
    select: { id: true },
  });
  if (!completedLoan) {
    return NextResponse.json(
      {
        error: "NOT_ELIGIBLE",
        message: "ניתן לדרג רק כלי שהשאלת והחזרת בפועל.",
      },
      { status: 403 }
    );
  }

  try {
    const review = await prisma.review.create({
      data: {
        toolId,
        userId: session.user.id,
        rating,
        comment: comment || null,
        type: "TOOL",
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });
    return NextResponse.json({ ok: true, review }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "ALREADY_REVIEWED", message: "כבר דירגת את הכלי הזה." },
        { status: 409 }
      );
    }
    console.error("[reviews.POST] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
