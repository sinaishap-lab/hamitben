import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-helpers";
import { gemachCreateSchema } from "@/lib/validation";

// GET /api/gemachs — public list of active gemachs
export async function GET() {
  const gemachs = await prisma.gemach.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      lat: true,
      lng: true,
      phone: true,
      imageUrl: true,
      _count: { select: { tools: { where: { isActive: true } } } },
    },
  });
  return NextResponse.json({ gemachs });
}

// POST /api/gemachs — ADMIN creates a new gemach, promotes target user to GEMACH_MANAGER
export async function POST(req: Request) {
  const r = await requireRole("ADMIN");
  if ("error" in r) return r.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = gemachCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { managerPhone, ...gemachData } = parsed.data;

  const manager = await prisma.user.findUnique({
    where: { phone: managerPhone },
    select: { id: true, status: true, role: true, managedGemach: { select: { id: true } } },
  });
  if (!manager) {
    return NextResponse.json(
      { error: "MANAGER_NOT_FOUND", message: "לא נמצא משתמש עם הטלפון הזה" },
      { status: 404 }
    );
  }
  if (manager.status !== "APPROVED") {
    return NextResponse.json(
      { error: "MANAGER_NOT_APPROVED", message: "המשתמש עוד לא אושר במערכת" },
      { status: 400 }
    );
  }
  if (manager.managedGemach) {
    return NextResponse.json(
      { error: "MANAGER_HAS_GEMACH", message: "המשתמש כבר מנהל גמח אחר" },
      { status: 409 }
    );
  }

  try {
    const gemach = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: manager.id },
        data: { role: "GEMACH_MANAGER" },
      });
      return tx.gemach.create({
        data: { ...gemachData, managerId: manager.id },
      });
    });
    return NextResponse.json({ ok: true, gemach }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "DUPLICATE", field: "name", message: "שם הגמח כבר תפוס" },
        { status: 409 }
      );
    }
    console.error("[gemachs.POST] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
