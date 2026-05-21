import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
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

    // TODO (Phase 6): notify admin of new signup via WhatsApp (spec §8.2)

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
