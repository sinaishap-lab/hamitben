import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Route policies (spec §3)
// - /admin/*           → ADMIN only
// - /gemach/*          → GEMACH_MANAGER or ADMIN
// - /my-loans, /profile, /loans/new → any signed-in user (APPROVED for actions, enforced at API level)
// - Banned users blocked from loan-creation endpoints
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthed = !!token;
  const role = token?.role as string | undefined;
  const isBanned = token?.isBanned === true;

  // Block banned users from creating loans (UI + API)
  if (
    isBanned &&
    (pathname.startsWith("/loans/new") ||
      (pathname.startsWith("/api/loans") && req.method === "POST"))
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "BANNED",
          message:
            "חשבונך חסום מהשאלות עקב החזרת כלי באיחור. ניתן לפנות למנהל ראשי.",
        },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL("/profile?reason=banned", req.url));
  }

  // Admin-only routes
  if (pathname.startsWith("/admin")) {
    if (!isAuthed) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      );
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Gemach-manager routes
  if (pathname.startsWith("/gemach/")) {
    if (!isAuthed) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      );
    }
    if (role !== "GEMACH_MANAGER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Authenticated-only user routes
  const requiresAuth = ["/my-loans", "/profile", "/loans/new"];
  if (requiresAuth.some((p) => pathname.startsWith(p))) {
    if (!isAuthed) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/gemach/:path*",
    "/my-loans/:path*",
    "/profile/:path*",
    "/loans/:path*",
    "/api/loans/:path*",
  ],
};
