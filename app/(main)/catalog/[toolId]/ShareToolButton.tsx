"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Spec §16.1 – share a tool to WhatsApp
export function ShareToolButton({
  toolName,
  gemachName,
  dailyRate,
}: {
  toolName: string;
  gemachName: string;
  dailyRate: number;
}) {
  function share() {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `https://hamitben.co.il/`;
    const price =
      dailyRate > 0 ? `₪${dailyRate} ליום` : "ללא עלות";
    const message =
      `🌾 *המתבן* – גמח כלי עבודה חקלאיים\n\n` +
      `מצאתי כלי שאולי יעניין אותך:\n` +
      `*${toolName}* – ${gemachName}\n` +
      `${price}\n\n` +
      `לצפייה והשאלה: ${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <Button variant="outline" size="md" onClick={share} className="w-auto">
      <Share2 className="w-4 h-4" />
      שתף
    </Button>
  );
}
