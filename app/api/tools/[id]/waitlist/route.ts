import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/tools/[id]/waitlist — join (spec §20.1)
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
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
      { error: "BANNED", message: "חשבונך חסום" },
      { status: 403 }
    );
  }

  const tool = await prisma.tool.findFirst({
    where: { id: params.id, isActive: true },
    select: { id: true, status: true },
  });
  if (!tool) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (tool.status === "AVAILABLE") {
    return NextResponse.json(
      { error: "TOOL_AVAILABLE", message: "הכלי פנוי – אין צורך להמתין" },
      { status: 409 }
    );
  }

  try {
    const row = await prisma.$transaction(async (tx) => {
      const last = await tx.waitlist.findFirst({
        where: { toolId: tool.id },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      const nextPos = (last?.position ?? 0) + 1;
      return tx.waitlist.create({
        data: {
          toolId: tool.id,
          userId: session.user.id,
          position: nextPos,
        },
        select: { position: true },
      });
    });

    return NextResponse.json({ joined: true, position: row.position }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Already in waitlist – fetch current position
      const existing = await prisma.waitlist.findUnique({
        where: {
          toolId_userId: { toolId: params.id, userId: session.user.id },
        },
        select: { position: true },
      });
      return NextResponse.json({
        joined: true,
        position: existing?.position ?? null,
      });
    }
    console.error("[waitlist.POST] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}

// DELETE /api/tools/[id]/waitlist — leave
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const row = await tx.waitlist.findUnique({
        where: {
          toolId_userId: { toolId: params.id, userId: session.user.id },
        },
        select: { id: true, position: true },
      });
      if (!row) return;

      await tx.waitlist.delete({ where: { id: row.id } });

      // Shift everyone above down by one
      await tx.waitlist.updateMany({
        where: { toolId: params.id, position: { gt: row.position } },
        data: { position: { decrement: 1 } },
      });
    });
    return NextResponse.json({ joined: false, position: null });
  } catch (err) {
    console.error("[waitlist.DELETE] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
