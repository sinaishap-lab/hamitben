import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toolUpdateSchema } from "@/lib/validation";

async function loadAndAuthorize(toolId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) } as const;
  }
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: { id: true, gemachId: true, gemach: { select: { managerId: true } } },
  });
  if (!tool) {
    return { error: NextResponse.json({ error: "NOT_FOUND" }, { status: 404 }) } as const;
  }
  const isAdmin = session.user.role === "ADMIN";
  const isOwner = tool.gemach.managerId === session.user.id;
  if (!isAdmin && !isOwner) {
    return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) } as const;
  }
  return { tool } as const;
}

// GET /api/tools/[id] — public
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const tool = await prisma.tool.findFirst({
    where: { id: params.id, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      category: { select: { id: true, name: true } },
      images: true,
      status: true,
      autoApprove: true,
      depositAmount: true,
      dailyRate: true,
      maxDays: true,
      gemach: { select: { id: true, name: true, address: true, phone: true } },
    },
  });
  if (!tool) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ tool });
}

// PUT /api/tools/[id]
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await loadAndAuthorize(params.id);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = toolUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const tool = await prisma.tool.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json({ ok: true, tool });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("[tools.PUT] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}

// DELETE /api/tools/[id] — soft delete (isActive=false) preserves loan history
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await loadAndAuthorize(params.id);
  if ("error" in auth) return auth.error;

  try {
    await prisma.tool.update({
      where: { id: params.id },
      data: { isActive: false, status: "INACTIVE" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("[tools.DELETE] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
