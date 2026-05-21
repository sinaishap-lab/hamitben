import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gemachRequestSchema } from "@/lib/validation";
import { notifyAdmins } from "@/lib/notifications";

// POST /api/gemach-requests — spec §17: request to open a new gemach.
// Public (no auth required) — anyone in a community can ask.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = gemachRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const request = await prisma.gemachRequest.create({
      data: parsed.data,
      select: { id: true },
    });
    await notifyAdmins("GEMACH_REQUEST_CREATED", parsed.data);
    return NextResponse.json({ ok: true, id: request.id }, { status: 201 });
  } catch (err) {
    console.error("[gemach-requests.POST] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
