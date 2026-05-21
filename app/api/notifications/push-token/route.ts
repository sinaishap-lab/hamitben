import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const tokenSchema = z.object({
  // Browsers send a JSON PushSubscription; we store it stringified.
  token: z.string().min(20).max(4000),
  platform: z.enum(["web", "android", "ios"]).default("web"),
});

/**
 * POST /api/notifications/push-token
 *
 * Registers (or upserts) a web-push subscription for the authenticated user.
 * Dedup happens on the unique `token` column.
 */
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

  const parsed = tokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { token, platform } = parsed.data;

  await prisma.pushToken.upsert({
    where: { token },
    create: { token, platform, userId: session.user.id },
    update: { userId: session.user.id, platform },
  });

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/notifications/push-token?token=...
 * Unregister a subscription (e.g. on sign-out or user action).
 */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "MISSING_TOKEN" }, { status: 400 });
  }
  await prisma.pushToken.deleteMany({
    where: { token, userId: session.user.id },
  });
  return NextResponse.json({ ok: true });
}
