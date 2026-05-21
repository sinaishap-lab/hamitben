"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Spec §16.2 – referral code + WhatsApp share
export function ReferralCard({
  code,
  discountTokens,
}: {
  code: string;
  discountTokens: number;
}) {
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${code}`
      : `/register?ref=${code}`;

  const message = `🌾 *המתבן* – גמח כלי עבודה חקלאיים\nהצטרף דרך הקישור שלי:\n${link}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <section className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold">הזמן חבר</h2>
        <span className="text-xs text-text-muted">
          {discountTokens > 0
            ? `${discountTokens} אסימוני הנחה צבורים`
            : "כל הזמנה = 10% הנחה"}
        </span>
      </div>
      <p className="text-sm text-text-muted">
        שתף את הקישור — כשחבר נרשם ועושה השאלה ראשונה תקבל אסימון הנחה.
      </p>
      <div className="flex items-center gap-2 bg-primary-50 rounded-xl px-3 py-2 font-mono text-sm" dir="ltr">
        <span className="text-text-muted">code:</span>
        <span className="font-bold text-primary">{code}</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => window.open(whatsappUrl, "_blank")}
          className="flex-1"
        >
          <Share2 className="w-4 h-4" aria-hidden />
          שלח לוואטסאפ
        </Button>
        <Button variant="outline" size="sm" onClick={copyLink} className="flex-1">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "הועתק" : "העתק קישור"}
        </Button>
      </div>
    </section>
  );
}
