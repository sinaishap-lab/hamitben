import { NextResponse } from "next/server";
import { Prisma, type ToolRequestStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-helpers";

const updateSchema = z.object({
  status: z.enum(["PENDING", "NOTED", "FULFILLED"] as const),
});

// PUT /api/tool-requests/[id] — admin updates status
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    const updated = await prisma.toolRequest.update({
      where: { id: params.id },
      data: { status: parsed.data.status as ToolRequestStatus },
      select: { id: true, status: true },
    });
    return NextResponse.json({ ok: true, request: updated });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("[tool-requests.PUT] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
