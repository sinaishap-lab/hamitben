"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LoanStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type Action = "approve" | "reject" | "cancel" | "collect" | "returnOk" | "returnOverdue";

export function LoanManagerActions({
  loanId,
  status,
}: {
  loanId: string;
  status: LoanStatus;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<Action | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<null | "reject" | "overdue">(null);
  const [reason, setReason] = useState("");

  async function call(
    path: string,
    payload: Record<string, unknown> | null,
    action: Action
  ) {
    setBusy(action);
    setErr(null);
    try {
      const res = await fetch(path, {
        method: "PUT",
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.message ?? "הפעולה נכשלה");
        return;
      }
      startTransition(() => router.refresh());
      setConfirming(null);
      setReason("");
    } catch {
      setErr("בעיית רשת");
    } finally {
      setBusy(null);
    }
  }

  if (status === "REJECTED" || status === "CANCELLED" || status === "RETURNED" || status === "OVERDUE") {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 mt-1">
      {err && <Alert variant="error">{err}</Alert>}

      {status === "PENDING" && !confirming && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            loading={busy === "approve"}
            onClick={() => call(`/api/loans/${loanId}/approve`, null, "approve")}
            className="flex-1"
          >
            אשר
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setConfirming("reject")}
            className="flex-1"
          >
            דחה
          </Button>
        </div>
      )}

      {status === "PENDING" && confirming === "reject" && (
        <div className="flex flex-col gap-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="סיבת דחייה (אופציונלי)"
            rows={2}
            className="w-full rounded-xl border border-primary-100 bg-bg-surface p-2 text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="danger"
              loading={busy === "reject"}
              onClick={() =>
                call(
                  `/api/loans/${loanId}/reject`,
                  { reason: reason || null },
                  "reject"
                )
              }
              className="flex-1"
            >
              אשר דחייה
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirming(null)}
              className="flex-1"
            >
              ביטול
            </Button>
          </div>
        </div>
      )}

      {status === "APPROVED" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            loading={busy === "collect"}
            onClick={() => call(`/api/loans/${loanId}/collect`, null, "collect")}
            className="flex-1"
          >
            סמן כנאסף
          </Button>
          <Button
            size="sm"
            variant="ghost"
            loading={busy === "cancel"}
            onClick={() => call(`/api/loans/${loanId}/cancel`, null, "cancel")}
            className="flex-1"
          >
            בטל
          </Button>
        </div>
      )}

      {status === "ACTIVE" && !confirming && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            loading={busy === "returnOk"}
            onClick={() =>
              call(
                `/api/loans/${loanId}/return`,
                { outcome: "OK" },
                "returnOk"
              )
            }
            className="flex-1"
          >
            הוחזר תקין
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setConfirming("overdue")}
            className="flex-1"
          >
            נזק / איחור
          </Button>
        </div>
      )}

      {status === "ACTIVE" && confirming === "overdue" && (
        <div className="flex flex-col gap-2">
          <Alert variant="warning">
            פעולה זו תיגבה את הפיקדון מלא ותחסום את המשתמש מהשאלות עתידיות.
          </Alert>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="תיאור הנזק / סיבת איחור"
            rows={2}
            className="w-full rounded-xl border border-primary-100 bg-bg-surface p-2 text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="danger"
              loading={busy === "returnOverdue"}
              onClick={() =>
                call(
                  `/api/loans/${loanId}/return`,
                  { outcome: "OVERDUE", notes: reason || null },
                  "returnOverdue"
                )
              }
              className="flex-1"
            >
              אשר נזק/איחור
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirming(null)}
              className="flex-1"
            >
              ביטול
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
