"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GUEST_COOKIE } from "@/components/auth/GuestEntryButton";

/**
 * Sign-out control. `compact` renders an icon-only pill (for the TopBar);
 * otherwise a full-width labelled button (for the profile page).
 */
export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  function handleLogout() {
    setLoading(true);
    // Clear the guest marker too — a former user logging out is a fresh
    // visitor, not someone who chose "כניסה כאורח".
    document.cookie = `${GUEST_COOKIE}=; path=/; max-age=0`;
    // Land on /login so the user can immediately sign in as someone else.
    signOut({ callbackUrl: "/login" });
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        aria-label="התנתקות"
        className="flex items-center gap-1 px-2.5 h-8 rounded-full border border-primary-100 text-text-muted text-xs hover:bg-primary-50 disabled:opacity-50"
      >
        <LogOut className="w-3.5 h-3.5" aria-hidden />
        יציאה
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      onClick={handleLogout}
      loading={loading}
    >
      <LogOut className="w-4 h-4" aria-hidden />
      התנתקות
    </Button>
  );
}
