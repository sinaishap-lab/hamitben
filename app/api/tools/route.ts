import { NextResponse } from "next/server";
import { Prisma, type ToolCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toolCreateSchema } from "@/lib/validation";

// GET /api/tools — public catalog. Supports ?q, ?category, ?gemachId, ?available
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const category = url.searchParams.get("category") || undefined;
  const gemachId = url.searchParams.get("gemachId") || undefined;
  const available = url.searchParams.get("available") === "1";

  const where: Prisma.ToolWhereInput = {
    isActive: true,
    ...(category ? { category: category as ToolCategory } : {}),
    ...(gemachId ? { gemachId } : {}),
    ...(available ? { status: "AVAILABLE" } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const tools = await prisma.tool.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      images: true,
      status: true,
      depositAmount: true,
      dailyRate: true,
      gemach: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ tools });
}

// POST /api/tools — GEMACH_MANAGER of target gemach / ADMIN
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

  const parsed = toolCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Authorisation: admin OR manager of the target gemach
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin) {
    const gemach = await prisma.gemach.findUnique({
      where: { id: parsed.data.gemachId },
      select: { managerId: true },
    });
    if (!gemach || gemach.managerId !== session.user.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
  }

  try {
    const tool = await prisma.tool.create({ data: parsed.data });
    return NextResponse.json({ ok: true, tool }, { status: 201 });
  } catch (err) {
    console.error("[tools.POST] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
