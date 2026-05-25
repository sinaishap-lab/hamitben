import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { gemachUpdateSchema } from "@/lib/validation";

// GET /api/gemachs/[id] — public
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const gemach = await prisma.gemach.findFirst({
    where: { id: params.id, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      lat: true,
      lng: true,
      phone: true,
      imageUrl: true,
      manager: { select: { name: true } },
      _count: { select: { tools: { where: { isActive: true } } } },
    },
  });
  if (!gemach) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ gemach });
}

// PUT /api/gemachs/[id] — ADMIN or this gemach's manager.
// If `managerPhone` is sent, admin is reassigning the manager — we look the
// user up, validate, swap roles atomically, and update the gemach pointer.
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
  let isOwner = false;
  if (!isAdmin) {
    const gemach = await prisma.gemach.findUnique({
      where: { id: params.id },
      select: { managerId: true },
    });
    isOwner = gemach?.managerId === session.user.id;
  }
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = gemachUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Separate manager reassignment from the rest of the update payload.
  const { managerPhone, ...gemachFields } = parsed.data;
  const data: Prisma.GemachUpdateInput = { ...gemachFields };

  // Manager reassignment (admin-only)
  let newManagerId: string | null = null;
  let oldManagerId: string | null = null;
  if (managerPhone !== undefined && managerPhone !== null && managerPhone !== "") {
    if (!isAdmin) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const candidate = await prisma.user.findFirst({
      where: { phone: managerPhone, deletedAt: null },
      select: {
        id: true,
        status: true,
        isBanned: true,
        managedGemach: { select: { id: true } },
      },
    });
    if (!candidate) {
      return NextResponse.json(
        { error: "MANAGER_NOT_FOUND", message: "משתמש לא נמצא במערכת" },
        { status: 404 }
      );
    }
    if (candidate.status !== "APPROVED") {
      return NextResponse.json(
        { error: "MANAGER_NOT_APPROVED", message: "המשתמש לא מאושר" },
        { status: 400 }
      );
    }
    if (candidate.isBanned) {
      return NextResponse.json(
        { error: "MANAGER_BANNED", message: "המשתמש חסום" },
        { status: 400 }
      );
    }
    if (candidate.managedGemach && candidate.managedGemach.id !== params.id) {
      return NextResponse.json(
        {
          error: "MANAGER_HAS_GEMACH",
          message: "המשתמש כבר מנהל גמח אחר — צריך להעביר אותו קודם",
        },
        { status: 409 }
      );
    }

    const current = await prisma.gemach.findUnique({
      where: { id: params.id },
      select: { managerId: true },
    });
    if (current && current.managerId !== candidate.id) {
      newManagerId = candidate.id;
      oldManagerId = current.managerId;
      data.manager = { connect: { id: candidate.id } };
    }
  }

  try {
    // Run as a transaction so role changes + gemach update are atomic.
    const result = await prisma.$transaction(async (tx) => {
      if (newManagerId && oldManagerId) {
        // Demote previous manager — they're no longer managing anything.
        await tx.user.update({
          where: { id: oldManagerId },
          data: { role: "REGULAR" },
        });
        // Promote new manager.
        await tx.user.update({
          where: { id: newManagerId },
          data: { role: "GEMACH_MANAGER" },
        });
      }
      return tx.gemach.update({ where: { id: params.id }, data });
    });
    return NextResponse.json({ ok: true, gemach: result });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: "DUPLICATE", field: "name", message: "שם הגמח כבר תפוס" },
          { status: 409 }
        );
      }
    }
    console.error("[gemach.PUT] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
