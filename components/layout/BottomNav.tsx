"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout, ClipboardList, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Bottom nav = the app's real sections only.
// The landing page (/) is guest-only and the profile lives behind the
// TopBar avatar — neither belongs here.
const ITEMS = [
  { href: "/catalog", label: "קטלוג", icon: Sprout },
  { href: "/my-loans", label: "ההשאלות שלי", icon: ClipboardList },
  { href: "/about", label: "אודות", icon: Heart },
  { href: "/contact", label: "צור קשר", icon: MessageCircle },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ניווט ראשי"
      className="fixed bottom-0 inset-x-0 z-40 bg-bg-surface border-t border-primary-100 mx-auto max-w-screen-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4 h-16">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
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
