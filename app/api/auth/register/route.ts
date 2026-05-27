import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { notifyAdmins } from "@/lib/notifications";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Public endpoint — rate-limit by IP. 5 registration attempts per 10 min
  // is enough for a real user retrying a typo'd password while still being
  // a meaningful spam barrier.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`register:${ip}`, {
    windowMs: 10 * 60_000,
    maxRequests: 5,
  });
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: "יותר מדי ניסיונות הרשמה. נסה שוב בעוד מספר דקות.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { name, phone, email, password, referralCode } = parsed.data;

  // Optional referral lookup (spec §16.2)
  let referredById: string | undefined;
  if (referralCode) {
    const inviter = await prisma.user.findUnique({
      where: { referralCode },
      select: { id: true, deletedAt: true },
    });
    if (inviter && !inviter.deletedAt) {
      referredById = inviter.id;
    }
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        termsSignedAt: new Date(),
        termsVersion: process.env.TERMS_VERSION || "1.0",
        referredById,
      },
      select: { id: true, name: true, phone: true },
    });

    // Notify admins about the new signup (spec §8.2)
    await notifyAdmins("USER_REGISTERED", {
      name: user.name,
      phone: user.phone,
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.[0];
      const field = target === "email" ? "email" : "phone";
      const message =
        field === "email"
          ? "כתובת האימייל כבר רשומה במערכת"
          : "מספר הטלפון כבר רשום במערכת";
      return NextResponse.json(
        { error: "DUPLICATE", field, message },
        { status: 409 }
      );
    }
    console.error("[register] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
