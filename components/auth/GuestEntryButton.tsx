"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Cookie marking that the visitor explicitly chose to browse as a guest.
// The TopBar reads it to decide whether to show the "אורח" avatar — it must
// NOT appear before the user makes this choice.
export const GUEST_COOKIE = "hamitben_guest";

export function GuestEntryButton() {
  const router = useRouter();

  function enterAsGuest() {
    document.cookie = `${GUEST_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    router.push("/catalog");
    // Re-render server components (incl. the layout's TopBar) so the new
    // cookie is picked up immediately.
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={enterAsGuest}
      className="w-full h-12 rounded-xl text-text-muted font-medium flex items-center justify-center gap-2"
    >
      כניסה כאורח
      <ArrowLeft className="w-4 h-4" aria-hidden />
    </button>
  );
}
