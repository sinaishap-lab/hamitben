"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

// Spec §20.1 – waitlist
export function WaitlistButton({
  toolId,
  joined,
  position,
  totalAhead,
}: {
  toolId: string;
  joined: boolean;
  position: number | null;
  totalAhead: number;
}) {
  const router = useRouter();
  const [isJoined, setIsJoined] = useState(joined);
  const [currentPos, setCurrentPos] = useState(position);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tools/${toolId}/waitlist`, {
        method: isJoined ? "DELETE" : "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        setError(data.message ?? "הפעולה נכשלה");
        return;
      }
      const data = (await res.json()) as {
        joined: boolean;
        position: number | null;
      };
      setIsJoined(data.joined);
      setCurrentPos(data.position);
      router.refresh();
    } catch {
      setError("בעיית רשת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert variant="error">{error}</Alert>}
      <Button
        type="button"
        variant={isJoined ? "outline" : "secondary"}
        size="md"
        loading={loading}
        onClick={toggle}
      >
        {isJoined ? (
          <>
            <BellOff className="w-4 h-4" />
            יציאה מרשימת ההמתנה
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            הצטרף לרשימת המתנה
          </>
        )}
      </Button>
      <p className="text-xs text-text-muted text-center">
        {isJoined
          ? `אתה במקום ${currentPos ?? "?"} בתור · נשלח לך WhatsApp ברגע שהכלי יתפנה`
          : totalAhead > 0
            ? `${totalAhead} ${totalAhead === 1 ? "אדם" : "אנשים"} בתור`
            : "הצטרף כדי להיות הראשון לדעת כשהכלי יתפנה"}
      </p>
    </div>
  );
}
