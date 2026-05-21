"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function CancelLoanButton({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function perform() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/loans/${loanId}/cancel`, { method: "PUT" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.message ?? "ביטול נכשל");
        return;
      }
      setConfirming(false);
      startTransition(() => router.refresh());
    } catch {
      setErr("בעיית רשת");
    } finally {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setConfirming(true)}
        className="w-auto"
      >
        בטל בקשה
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {err && <Alert variant="error">{err}</Alert>}
      <Alert variant="warning">לבטל את הבקשה?</Alert>
      <div className="flex gap-2">
        <Button size="sm" variant="danger" loading={loading} onClick={perform}>
          כן, בטל
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          השאר
        </Button>
      </div>
    </div>
  );
}
