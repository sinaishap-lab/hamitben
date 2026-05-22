"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import { ToolCalendar } from "./ToolCalendar";

/**
 * Availability calendar for guests. The calendar is clickable, but instead of
 * selecting dates a click reveals a login / register prompt (spec: guests must
 * sign in to request a loan).
 */
export function GuestAvailability({
  toolId,
  maxDays,
}: {
  toolId: string;
  maxDays: number;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  const callback = encodeURIComponent(`/catalog/${toolId}`);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-bold">זמינות</h2>

      <ToolCalendar
        toolId={toolId}
        maxDays={maxDays}
        onGuestClick={() => setShowPrompt(true)}
      />

      {showPrompt && (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-sm text-text">
            כדי לבחור תאריכים ולבקש השאלה צריך חשבון. ההרשמה מהירה והשימוש חינמי.
          </p>
          <div className="flex gap-2">
            <Link
              href={`/login?callbackUrl=${callback}`}
              className="flex-1 h-11 rounded-xl bg-primary text-text-inverse font-medium flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" aria-hidden />
              כניסה
            </Link>
            <Link
              href="/register"
              className="flex-1 h-11 rounded-xl border-2 border-primary text-primary font-medium flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" aria-hidden />
              הרשמה
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
