import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/tools/[id]/favorite — add to favorites (idempotent)
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const tool = await prisma.tool.findFirst({
    where: { id: params.id, isActive: true },
    select: { id: true },
  });
  if (!tool) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.favorite.upsert({
    where: {
      userId_toolId: { userId: session.user.id, toolId: params.id },
    },
    create: { userId: session.user.id, toolId: params.id },
    update: {},
  });
  return NextResponse.json({ ok: true, favorited: true }, { status: 201 });
}

// DELETE /api/tools/[id]/favorite — remove from favorites
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, toolId: params.id },
  });
  return NextResponse.json({ ok: true, favorited: false });
}
