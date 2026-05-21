"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function DeleteToolButton({
  toolId,
  redirectAfter,
}: {
  toolId: string;
  redirectAfter: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function perform() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/tools/${toolId}`, { method: "DELETE" });
      if (!res.ok) {
        setErr("מחיקה נכשלה");
        setLoading(false);
        return;
      }
      router.push(redirectAfter);
      router.refresh();
    } catch {
      setErr("בעיית רשת");
      setLoading(false);
    }
  }

  if (step === "idle") {
    return (
      <Button
        variant="danger"
        size="sm"
        className="w-auto"
        onClick={() => setStep("confirm")}
      >
        <Trash2 className="w-4 h-4" />
        הסר כלי
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {err && <Alert variant="error">{err}</Alert>}
      <Alert variant="error">להסיר את הכלי מהקטלוג?</Alert>
      <div className="flex gap-2">
        <Button variant="danger" size="sm" loading={loading} onClick={perform}>
          כן, הסר
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => setStep("idle")}
        >
          ביטול
        </Button>
      </div>
    </div>
  );
}
