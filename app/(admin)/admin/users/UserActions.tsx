"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

/**
 * Simplified user actions:
 *  - PENDING users get a one-click "אשר" alongside Edit + Delete.
 *  - Everyone else gets just Edit + Delete.
 *  - Self-delete is hidden so the current admin can't accidentally remove
 *    themselves from the admin panel (they can still self-delete via /profile).
 */
export function UserActions({
  userId,
  isSelf,
  isPending,
  userName,
}: {
  userId: string;
  isSelf: boolean;
  isPending: boolean;
  userName: string;
}) {
  const router = useRouter();
  const [transition, startTransition] = useTransition();
  const [busy, setBusy] = useState<"approve" | "delete" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function approve() {
    setErr(null);
    setBusy("approve");
    try {
      const res = await fetch(`/api/users/${userId}/approve`, {
        method: "PUT",
      });
      if (!res.ok) {
        setErr("האישור נכשל");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setErr("בעיית רשת");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm(`למחוק את "${userName}"? היסטוריית ההשאלות תישמר בצורה אנונימית.`)) {
      return;
    }
    setErr(null);
    setBusy("delete");
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        setErr("המחיקה נכשלה");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setErr("בעיית רשת");
    } finally {
      setBusy(null);
    }
  }

  const disabled = transition || busy !== null;

  return (
    <div className="flex flex-wrap gap-2 mt-1 items-center">
      {err && <Alert variant="error" className="w-full">{err}</Alert>}

      {isPending && (
        <Button
          size="sm"
          variant="primary"
          loading={busy === "approve"}
          disabled={disabled}
          onClick={approve}
          className="w-auto"
        >
          <Check className="w-4 h-4" />
          אשר
        </Button>
      )}

      <Link
        href={`/admin/users/${userId}/edit`}
        className="inline-flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-lg text-sm font-medium border-2 border-primary text-primary bg-bg-surface hover:bg-primary-50 transition-colors"
      >
        <Pencil className="w-4 h-4" aria-hidden />
        ערוך
      </Link>

      {!isSelf && (
        <Button
          size="sm"
          variant="danger"
          loading={busy === "delete"}
          disabled={disabled}
          onClick={remove}
          className="w-auto"
        >
          <Trash2 className="w-4 h-4" />
          מחק
        </Button>
      )}
    </div>
  );
}
