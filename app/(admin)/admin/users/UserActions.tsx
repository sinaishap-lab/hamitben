"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { UserStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

type Props = {
  userId: string;
  status: UserStatus;
  isBanned: boolean;
};

type ActionKey = "approve" | "reject" | "suspend" | "ban" | "unban";

export function UserActions({ userId, status, isBanned }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<ActionKey | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(action: ActionKey) {
    setErr(null);
    setBusy(action);
    try {
      const res = await fetch(`/api/users/${userId}/${action}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: action === "ban" ? JSON.stringify({}) : undefined,
      });
      if (!res.ok) {
        setErr("הפעולה נכשלה");
        setBusy(null);
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setErr("בעיית רשת");
    } finally {
      setBusy(null);
    }
  }

  const disabled = pending || busy !== null;

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {err && <Alert variant="error" className="w-full">{err}</Alert>}

      {status === "PENDING" && (
        <>
          <Button
            size="sm"
            variant="primary"
            loading={busy === "approve"}
            disabled={disabled}
            onClick={() => run("approve")}
            className="w-auto"
          >
            אשר
          </Button>
          <Button
            size="sm"
            variant="danger"
            loading={busy === "reject"}
            disabled={disabled}
            onClick={() => run("reject")}
            className="w-auto"
          >
            דחה
          </Button>
        </>
      )}

      {status === "APPROVED" && !isBanned && (
        <Button
          size="sm"
          variant="outline"
          loading={busy === "suspend"}
          disabled={disabled}
          onClick={() => run("suspend")}
          className="w-auto"
        >
          השעה
        </Button>
      )}

      {status === "SUSPENDED" && (
        <Button
          size="sm"
          variant="primary"
          loading={busy === "approve"}
          disabled={disabled}
          onClick={() => run("approve")}
          className="w-auto"
        >
          החזר לפעילות
        </Button>
      )}

      {isBanned ? (
        <Button
          size="sm"
          variant="primary"
          loading={busy === "unban"}
          disabled={disabled}
          onClick={() => run("unban")}
          className="w-auto"
        >
          הסר חסימה
        </Button>
      ) : (
        status === "APPROVED" && (
          <Button
            size="sm"
            variant="danger"
            loading={busy === "ban"}
            disabled={disabled}
            onClick={() => run("ban")}
            className="w-auto"
          >
            חסום
          </Button>
        )
      )}
    </div>
  );
}
