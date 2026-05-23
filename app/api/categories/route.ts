import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { categoryCreateSchema } from "@/lib/validation";

// GET /api/categories — ADMIN: list categories with tool counts
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      icon: true,
      sortOrder: true,
      _count: { select: { tools: true } },
    },
  });
  return NextResponse.json({ categories });
}

// POST /api/categories — ADMIN: create a category
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = categoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.create({ data: parsed.data });
    return NextResponse.json({ ok: true, category }, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "VALIDATION", issues: { name: ["קטגוריה בשם זה כבר קיימת"] } },
        { status: 409 }
      );
    }
    console.error("[categories.POST] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
