"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GemachRequestStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";

export function GemachRequestActions({
  id,
  status,
}: {
  id: string;
  status: GemachRequestStatus;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<GemachRequestStatus | null>(null);

  async function setStatus(next: GemachRequestStatus) {
    setBusy(next);
    try {
      const res = await fetch(`/api/gemach-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) startTransition(() => router.refresh());
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING" && (
        <Button
          size="sm"
          variant="outline"
          loading={busy === "CONTACTED"}
          onClick={() => setStatus("CONTACTED")}
          className="w-auto"
        >
          סמן כיצרתי קשר
        </Button>
      )}
      {(status === "PENDING" || status === "CONTACTED") && (
        <>
          <Button
            size="sm"
            variant="primary"
            loading={busy === "OPENED"}
            onClick={() => setStatus("OPENED")}
            className="w-auto"
          >
            נפתח גמח
          </Button>
          <Button
            size="sm"
            variant="danger"
            loading={busy === "REJECTED"}
            onClick={() => setStatus("REJECTED")}
            className="w-auto"
          >
            דחה
          </Button>
        </>
      )}
    </div>
  );
}
