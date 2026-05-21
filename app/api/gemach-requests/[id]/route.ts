import { NextResponse } from "next/server";
import { Prisma, type GemachRequestStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-helpers";

const updateSchema = z.object({
  status: z.enum(["PENDING", "CONTACTED", "OPENED", "REJECTED"] as const),
  notes: z.string().trim().max(500).optional().nullable(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const r = await requireRole("ADMIN");
  if ("error" in r) return r.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.gemachRequest.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status as GemachRequestStatus,
        notes: parsed.data.notes ?? undefined,
      },
    });
    return NextResponse.json({ ok: true, request: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("[gemach-requests.PUT] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
