import Link from "next/link";
import { cookies } from "next/headers";
import { Shield, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { GUEST_COOKIE } from "@/components/auth/GuestEntryButton";

export async function TopBar() {
  const session = await auth();
  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "GEMACH_MANAGER";

  // The guest avatar appears only after the visitor explicitly chose
  // "כניסה כאורח" on the landing page (which sets this cookie).
  const enteredAsGuest = cookies().get(GUEST_COOKIE)?.value === "1";

  // Logged-in users never need the marketing landing page — point the logo
  // at the place that's actually useful for their role.
  const logoHref = isAdmin ? "/admin" : user ? "/catalog" : "/";
  const initial = user?.name?.trim().charAt(0) || "👤";

  return (
    <header className="sticky top-0 z-30 bg-bg-surface/85 backdrop-blur-md border-b border-primary-100/60 shadow-card">
      <div className="h-14 px-4 flex items-center justify-between gap-2">
        <Link
          href={logoHref}
          className="flex items-center gap-2.5 text-primary font-bold text-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            className="w-9 h-9 rounded-xl shadow-soft object-contain bg-bg-surface"
            aria-hidden
          />
          <span>המתבן</span>
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-gradient-primary text-text-inverse text-xs font-medium shadow-soft hover:shadow-glow hover:brightness-110 transition-all"
            >
              <Shield className="w-3.5 h-3.5" aria-hidden />
              ניהול
            </Link>
          )}
          {isManager && !isAdmin && (
            <Link
              href="/my-gemach"
              className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-gradient-primary text-text-inverse text-xs font-medium shadow-soft hover:shadow-glow hover:brightness-110 transition-all"
            >
              <Shield className="w-3.5 h-3.5" aria-hidden />
              הגמח שלי
            </Link>
          )}

          {user ? (
            <Link
              href="/profile"
              aria-label="פרופיל וחשבון"
              className="w-9 h-9 rounded-full bg-gradient-primary text-text-inverse flex items-center justify-center font-bold text-sm shrink-0 shadow-soft hover:shadow-glow hover:brightness-110 transition-all ring-2 ring-bg-surface"
            >
              {initial}
            </Link>
          ) : enteredAsGuest ? (
            /* Guest avatar — only after the visitor chose "כניסה כאורח" */
            <Link
              href="/guest"
              aria-label="אורח"
              className="flex items-center gap-1.5 ps-1 pe-3 h-9 rounded-full border border-primary-200 bg-bg-surface text-text-muted shrink-0 hover:border-primary-300 transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" aria-hidden />
              </span>
              <span className="text-xs font-medium">אורח</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
