import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toolDonationSchema } from "@/lib/validation";
import { notifyAdmins } from "@/lib/notifications";

// POST /api/tool-donation-requests — spec §18: someone offers to donate a tool.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = toolDonationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const request = await prisma.toolDonationRequest.create({
      data: parsed.data,
      select: { id: true },
    });
    await notifyAdmins("TOOL_DONATION_REQUEST", parsed.data);
    return NextResponse.json({ ok: true, id: request.id }, { status: 201 });
  } catch (err) {
    console.error("[tool-donation-requests.POST] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
