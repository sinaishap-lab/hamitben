import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { categoryUpdateSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }),
    } as const;
  }
  if (session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
    } as const;
  }
  return { ok: true } as const;
}

// PUT /api/categories/[id] — ADMIN: update a category
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = categoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json({ ok: true, category });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: "VALIDATION", issues: { name: ["קטגוריה בשם זה כבר קיימת"] } },
          { status: 409 }
        );
      }
      if (err.code === "P2025") {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
    }
    console.error("[categories.PUT] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}

// DELETE /api/categories/[id] — ADMIN: delete (blocked while tools reference it)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const toolCount = await prisma.tool.count({
    where: { categoryId: params.id },
  });
  if (toolCount > 0) {
    return NextResponse.json(
      {
        error: "HAS_TOOLS",
        message: `לא ניתן למחוק — ${toolCount} כלים משויכים לקטגוריה זו`,
      },
      { status: 409 }
    );
  }

  try {
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    console.error("[categories.DELETE] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
