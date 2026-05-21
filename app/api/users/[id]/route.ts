import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validation";

function forbidden() {
  return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
}

function unauthorized() {
  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}

// PUT – update own profile (or admin updates anyone)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const isSelf = session.user.id === params.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isSelf && !isAdmin) return forbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: params.id, deletedAt: null },
      data: { name: parsed.data.name, email: parsed.data.email },
      select: { id: true, name: true, email: true, phone: true },
    });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        {
          error: "DUPLICATE",
          field: "email",
          message: "כתובת האימייל כבר רשומה במערכת",
        },
        { status: 409 }
      );
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("[user.PUT] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}

// DELETE – soft delete (spec §7.7)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const isSelf = session.user.id === params.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isSelf && !isAdmin) return forbidden();

  try {
    // Soft-delete user + drop push tokens
    await prisma.$transaction([
      prisma.pushToken.deleteMany({ where: { userId: params.id } }),
      prisma.user.update({
        where: { id: params.id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("[user.DELETE] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
