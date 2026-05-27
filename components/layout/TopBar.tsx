import Link from "next/link";
import { Shield } from "lucide-react";
import { auth } from "@/lib/auth";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";

export async function TopBar() {
  const session = await auth();
  const user = session?.user;
  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "GEMACH_MANAGER";

  // The catalog is the entry point for everyone — logo always lands there
  // (admins → /admin so they reach their dashboard quickly).
  const logoHref = isAdmin ? "/admin" : "/catalog";
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

        {/* Organization logos — center of TopBar */}
        <div className="flex items-center gap-3 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rogum.jpeg"
            alt="רוג'ום"
            className="h-7 w-auto object-contain mix-blend-multiply"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kerenzion.jpeg"
            alt="קרן ציון"
            className="h-7 w-auto object-contain mix-blend-multiply"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* PWA install — surfaces itself only when the browser fires
              `beforeinstallprompt` (and disappears after install). */}
          <InstallAppButton />

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
          ) : (
            /* Visitor CTAs — surfaced everywhere so a guest can register
               from any page (no more landing-page gate). */
            <>
              <Link
                href="/login"
                className="text-xs text-primary font-medium px-2 h-8 inline-flex items-center hover:text-primary-700 transition-colors"
              >
                כניסה
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-gradient-primary text-text-inverse text-xs font-medium shadow-soft hover:shadow-glow hover:brightness-110 transition-all"
              >
                הרשמה
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
