import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-helpers";

const banSchema = z.object({
  reason: z.string().trim().max(200).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const r = await requireRole("ADMIN");
  if ("error" in r) return r.error;

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // empty body is OK
  }
  const parsed = banSchema.safeParse(body);
  const reason = parsed.success ? parsed.data.reason : undefined;

  try {
    const user = await prisma.user.update({
      where: { id: params.id, deletedAt: null },
      data: { isBanned: true, banReason: reason || "החזרת כלי באיחור" },
      select: { id: true, isBanned: true, banReason: true },
    });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("[user.ban] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
