"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function DeleteAccountButton({ userId }: { userId: string }) {
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function performDelete() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        setErr("מחיקה נכשלה. נסה שוב.");
        setLoading(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setErr("בעיית רשת");
      setLoading(false);
    }
  }

  if (step === "idle") {
    return (
      <Button
        variant="danger"
        size="md"
        onClick={() => setStep("confirm")}
        className="w-auto self-start"
      >
        <Trash2 className="w-4 h-4" />
        מחק חשבון
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="error">
        האם אתה בטוח? פעולה זו אינה הפיכה. החשבון יוסר וההיסטוריה תישמר אנונימית.
      </Alert>
      {err && <Alert variant="error">{err}</Alert>}
      <div className="flex gap-2">
        <Button variant="danger" loading={loading} onClick={performDelete}>
          כן, מחק לצמיתות
        </Button>
        <Button
          variant="ghost"
          onClick={() => setStep("idle")}
          disabled={loading}
        >
          ביטול
        </Button>
      </div>
    </div>
  );
}
