import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  profileUpdateSchema,
  userAdminUpdateSchema,
} from "@/lib/validation";

function forbidden() {
  return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
}

function unauthorized() {
  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}

// PUT — self updates name/email; admin can update everything except their
// own role/status/isBanned (so they can't accidentally lock themselves out).
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

  // Admin path uses the wider schema; everyone else can only change name+email.
  const schema = isAdmin ? userAdminUpdateSchema : profileUpdateSchema;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Self-lock guard — even an admin can't change their own role/status/ban.
  if (isAdmin && isSelf) {
    const dangerous = ["role", "status", "isBanned"] as const;
    const data = parsed.data as Record<string, unknown>;
    for (const f of dangerous) {
      if (data[f] !== undefined) {
        return NextResponse.json(
          {
            error: "SELF_LOCK",
            message: "לא ניתן לשנות את התפקיד / הסטטוס / החסימה של עצמך",
          },
          { status: 400 }
        );
      }
    }
  }

  // Build the update payload — only include keys that were sent.
  const data: Prisma.UserUpdateInput = {};
  const p = parsed.data;
  if ("name" in p && p.name !== undefined) data.name = p.name;
  if ("email" in p && p.email !== undefined) data.email = p.email;
  if (isAdmin) {
    const a = p as ReturnType<typeof userAdminUpdateSchema.parse>;
    if (a.phone !== undefined) data.phone = a.phone;
    if (a.role !== undefined) data.role = a.role;
    if (a.status !== undefined) data.status = a.status;
    if (a.isBanned !== undefined) data.isBanned = a.isBanned;
    if (a.banReason !== undefined) data.banReason = a.banReason;
  }

  try {
    const user = await prisma.user.update({
      where: { id: params.id, deletedAt: null },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        isBanned: true,
        banReason: true,
      },
    });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        const target = (err.meta?.target as string[] | undefined)?.[0];
        if (target === "phone") {
          return NextResponse.json(
            {
              error: "DUPLICATE",
              field: "phone",
              message: "מספר הטלפון כבר רשום במערכת",
            },
            { status: 409 }
          );
        }
        return NextResponse.json(
          {
            error: "DUPLICATE",
            field: "email",
            message: "כתובת האימייל כבר רשומה במערכת",
          },
          { status: 409 }
        );
      }
      if (err.code === "P2025") {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
    }
    console.error("[user.PUT] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}

// DELETE – soft delete (spec §7.7). Admin self-delete is technically allowed
// (some admin might genuinely want to leave) but the admin UI hides the
// button for the current user's own row to prevent accidents.
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
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("[user.DELETE] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
