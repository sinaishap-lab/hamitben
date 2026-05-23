"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tractor, ClipboardList, Heart, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

// Bottom nav = the app's real sections only.
// The landing page (/) is guest-only and the profile lives behind the
// TopBar avatar — neither belongs here.
const ITEMS = [
  { href: "/catalog", label: "קטלוג כלים", icon: Tractor },
  { href: "/my-loans", label: "ההשאלות שלי", icon: ClipboardList },
  { href: "/about", label: "אודות", icon: Heart },
  { href: "/contact", label: "צור קשר", icon: Phone },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ניווט ראשי"
      className="fixed bottom-0 inset-x-0 z-40 bg-bg-surface/90 backdrop-blur-md border-t border-primary-100/60 mx-auto max-w-screen-sm"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -2px 12px -2px rgb(31 74 92 / 0.08)",
      }}
    >
      <ul className="grid grid-cols-4 h-16 px-2 pt-1.5 pb-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href} className="flex items-center justify-center">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "h-full w-full flex flex-col items-center justify-center gap-0.5 text-[11px] rounded-2xl transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary font-semibold"
                    : "text-text-muted hover:text-primary hover:bg-primary-50/40"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    isActive && "stroke-[2.25] scale-110"
                  )}
                  aria-hidden
                />
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
