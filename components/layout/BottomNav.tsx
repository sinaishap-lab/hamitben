"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sprout, ClipboardList, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Spec §10 – ניווט תחתון (Bottom Nav)
// Order in RTL (right → left): קטלוג | השאלותיי | ראשי | צור קשר | פרופיל
const ITEMS = [
  { href: "/catalog", label: "קטלוג", icon: Sprout },
  { href: "/my-loans", label: "ההשאלות שלי", icon: ClipboardList },
  { href: "/", label: "ראשי", icon: Home },
  { href: "/contact", label: "צור קשר", icon: MessageCircle },
  { href: "/profile", label: "פרופיל", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ניווט ראשי"
      className="fixed bottom-0 inset-x-0 z-40 bg-bg-surface border-t border-primary-100 mx-auto max-w-screen-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5 h-16">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "h-full flex flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                  isActive
                    ? "text-primary font-medium"
                    : "text-text-muted hover:text-text"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn("w-5 h-5", isActive && "stroke-[2.5]")}
                  aria-hidden
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
