"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wheat } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/Button";

const AUTO_ADVANCE_MS = 5000;

const ROLE_LINE: Record<UserRole, string> = {
  REGULAR: "כאן תוכל לעיין בכלים, לבקש השאלה ולעקוב אחריה.",
  GEMACH_MANAGER: "מכאן תנהל את הכלים והבקשות של הגמח שלך.",
  ADMIN: "לוח הבקרה הראשי ממתין לך — משתמשים, גמחים ובקשות.",
};

export function WelcomeContent({
  name,
  dest,
  role,
}: {
  name: string;
  dest: string;
  role: UserRole;
}) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(AUTO_ADVANCE_MS / 1000);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    const advance = setTimeout(() => router.push(dest), AUTO_ADVANCE_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(advance);
    };
  }, [router, dest]);

  return (
    <div className="px-4 flex flex-col items-center text-center gap-6 min-h-[75vh] justify-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
        <Wheat className="w-12 h-12 text-primary" aria-hidden />
      </div>

      <div>
        <p className="text-lg text-text-muted">ברוכים הבאים</p>
        {name && (
          <h1 className="text-3xl font-bold text-primary mt-1">{name}</h1>
        )}
      </div>

      <p className="text-text-muted text-balance max-w-xs">
        טוב לראות אותך במתבן. {ROLE_LINE[role]}
      </p>

      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
        <Button onClick={() => router.push(dest)} size="lg">
          המשך
        </Button>
        <p className="text-xs text-text-muted">
          מועבר אוטומטית בעוד {secondsLeft} שניות…
        </p>
      </div>
    </div>
  );
}
