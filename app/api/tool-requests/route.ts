import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toolRequestCreateSchema } from "@/lib/validation";
import { notifyAdmins, notifyUser } from "@/lib/notifications";

// POST /api/tool-requests — spec §20.4 "missing tool" request
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

  const parsed = toolRequestCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const request = await prisma.toolRequest.create({
      data: {
        description: parsed.data.description,
        categoryId: parsed.data.categoryId || null,
        gemachId: parsed.data.gemachId || null,
        userId: session.user.id,
      },
      select: { id: true },
    });

    // Notify admins + the targeted gemach manager (if any)
    const data = {
      description: parsed.data.description,
      userName: session.user.name ?? "",
    };
    await notifyAdmins("TOOL_REQUEST_CREATED", data);
    if (parsed.data.gemachId) {
      const gemach = await prisma.gemach.findUnique({
        where: { id: parsed.data.gemachId },
        select: { managerId: true },
      });
      if (gemach) {
        await notifyUser(gemach.managerId, "TOOL_REQUEST_CREATED", data);
      }
    }

    return NextResponse.json({ ok: true, id: request.id }, { status: 201 });
  } catch (err) {
    console.error("[tool-requests.POST] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
