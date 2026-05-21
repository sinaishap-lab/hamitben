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

// PUT /api/gemachs/[id] — ADMIN or this gemach's manager
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

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

  try {
    const gemach = await prisma.gemach.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json({ ok: true, gemach });
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
