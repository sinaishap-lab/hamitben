import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

export const unauthorized = () =>
  NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

export const forbidden = () =>
  NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

/** Require an authenticated session. Returns the session or a NextResponse error. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) return { error: unauthorized() } as const;
  return { session } as const;
}

/** Require the authenticated user to have one of the given roles. */
export async function requireRole(...roles: UserRole[]) {
  const result = await requireSession();
  if ("error" in result) return result;
  if (!roles.includes(result.session.user.role)) {
    return { error: forbidden() } as const;
  }
  return result;
}
