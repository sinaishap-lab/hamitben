"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Spec §16.1 – share a gemach to WhatsApp
export function ShareGemachButton({
  gemachName,
  description,
  toolsCount,
}: {
  gemachName: string;
  description: string | null;
  toolsCount: number;
}) {
  function share() {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `https://hamitben.co.il/`;
    const summary = description
      ? description.slice(0, 100)
      : `${toolsCount} כלים זמינים להשאלה`;
    const message =
      `🌾 *המתבן* – גמח כלי עבודה חקלאיים\n\n` +
      `*${gemachName}*\n${summary}\n\n` +
      `לקטלוג: ${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <Button variant="primary" size="md" onClick={share}>
      <Share2 className="w-4 h-4" />
      שתף את הגמח
    </Button>
  );
}
