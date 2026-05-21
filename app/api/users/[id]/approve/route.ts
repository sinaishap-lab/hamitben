import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-helpers";

export async function PUT(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const r = await requireRole("ADMIN");
  if ("error" in r) return r.error;

  try {
    const user = await prisma.user.update({
      where: { id: params.id, deletedAt: null },
      data: { status: "APPROVED" },
      select: { id: true, status: true },
    });
    // TODO (Phase 6): notify user (WhatsApp/Push/Email)
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("[user.approve] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
