"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ToolDonationRequestStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";

export function ToolDonationActions({
  id,
  status,
}: {
  id: string;
  status: ToolDonationRequestStatus;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<ToolDonationRequestStatus | null>(null);

  async function setStatus(next: ToolDonationRequestStatus) {
    setBusy(next);
    try {
      const res = await fetch(`/api/tool-donation-requests/${id}`, {
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
            loading={busy === "ACCEPTED"}
            onClick={() => setStatus("ACCEPTED")}
            className="w-auto"
          >
            התקבל
          </Button>
          <Button
            size="sm"
            variant="danger"
            loading={busy === "DECLINED"}
            onClick={() => setStatus("DECLINED")}
            className="w-auto"
          >
            דחה
          </Button>
        </>
      )}
    </div>
  );
}
