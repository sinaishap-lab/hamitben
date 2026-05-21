"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ToolRequestStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";

export function ToolRequestActions({
  id,
  status,
}: {
  id: string;
  status: ToolRequestStatus;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<ToolRequestStatus | null>(null);

  async function setStatus(next: ToolRequestStatus) {
    setBusy(next);
    try {
      const res = await fetch(`/api/tool-requests/${id}`, {
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
    <div className="flex flex-wrap gap-2 mt-1">
      {status === "PENDING" && (
        <Button
          size="sm"
          variant="outline"
          loading={busy === "NOTED"}
          onClick={() => setStatus("NOTED")}
          className="w-auto"
        >
          סמן כנרשמה
        </Button>
      )}
      {status !== "FULFILLED" && (
        <Button
          size="sm"
          variant="primary"
          loading={busy === "FULFILLED"}
          onClick={() => setStatus("FULFILLED")}
          className="w-auto"
        >
          סמן כמולאה
        </Button>
      )}
    </div>
  );
}
