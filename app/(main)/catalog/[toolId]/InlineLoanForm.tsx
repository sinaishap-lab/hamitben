"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatShekel } from "@/lib/utils";
import { ToolCalendar } from "./ToolCalendar";

const DAY_MS = 24 * 60 * 60 * 1000;

// Pretty-print "21 במאי 2026" — local helper so we avoid an extra round-trip
function formatDateHe(dateKey: string): string {
  const d = new Date(dateKey);
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

type FieldErrors = Partial<Record<"startDate" | "endDate" | "termsAcknowledged", string[]>>;

export function InlineLoanForm({
  toolId,
  maxDays,
  dailyRate,
  depositAmount,
  discountTokens,
}: {
  toolId: string;
  maxDays: number;
  dailyRate: number;
  depositAmount: number;
  discountTokens: number;
}) {
  const router = useRouter();
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const [useToken, setUseToken] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const days = useMemo(() => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / DAY_MS) + 1);
  }, [start, end]);

  const grossTotal = useMemo(
    () => Math.round(dailyRate * days * 100) / 100,
    [dailyRate, days]
  );
  const discounted = useMemo(
    () => (useToken ? Math.round(dailyRate * days * 0.9 * 100) / 100 : grossTotal),
    [useToken, dailyRate, days, grossTotal]
  );

  const rangeComplete = Boolean(start && end);
  const canSubmit = rangeComplete && terms && !loading;

  async function submit() {
    if (!start || !end) return;
    setLoading(true);
    setErrors({});
    setServerError(null);

    if (!terms) {
      setErrors({ termsAcknowledged: ["יש לאשר את תנאי השאלה"] });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId,
          startDate: start,
          endDate: end,
          purpose: purpose || null,
          termsAcknowledged: true,
          useDiscountToken: useToken,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/my-loans?just-requested=1");
        return;
      }
      if (data.error === "VALIDATION") setErrors(data.issues as FieldErrors);
      else if (data.error === "CONFLICT") setServerError(data.message ?? "התאריכים תפוסים");
      else setServerError(data.message ?? "שליחה נכשלה");
    } catch {
      setServerError("בעיית רשת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-bold mb-2">בחר תאריכים</h2>
        <ToolCalendar
          toolId={toolId}
          maxDays={maxDays}
          selectable
          selectedStart={start}
          selectedEnd={end}
          onRangeChange={({ start: s, end: e }) => {
            setStart(s);
            setEnd(e);
            setErrors({});
            setServerError(null);
          }}
        />
      </div>

      {/* Summary visible only once a range is picked */}
      {rangeComplete && (
        <>
          <div className="bg-primary-50/50 rounded-xl p-3 text-sm flex flex-col gap-1">
            <Row label="תאריך התחלה" value={formatDateHe(start!)} />
            <Row label="תאריך סיום" value={formatDateHe(end!)} />
            <Row label="משך" value={`${days} ${days === 1 ? "יום" : "ימים"}`} />
            <Row label="פיקדון לנעילה" value={formatShekel(depositAmount)} />
            {dailyRate > 0 && (
              <>
                <Row
                  label="חיוב משוער"
                  value={
                    useToken
                      ? `${formatShekel(discounted)} (במקום ${formatShekel(grossTotal)})`
                      : formatShekel(grossTotal)
                  }
                />
                {useToken && (
                  <div className="text-xs text-success text-left">
                    חיסכון של {formatShekel(grossTotal - discounted)}
                  </div>
                )}
              </>
            )}
          </div>

          {discountTokens > 0 && dailyRate > 0 && (
            <label className="flex items-start gap-2 text-sm bg-accent/15 border border-accent rounded-xl p-3">
              <input
                type="checkbox"
                checked={useToken}
                onChange={(e) => setUseToken(e.target.checked)}
                className="mt-1 w-4 h-4 accent-primary"
              />
              <span className="flex-1">
                <span className="flex items-center gap-1 font-medium">
                  <Gift className="w-4 h-4" aria-hidden />
                  נצל אסימון הנחה (10%)
                </span>
                <span className="text-xs text-text-muted block">
                  יש לך {discountTokens} אסימוני הנחה
                </span>
              </span>
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">מטרת השימוש (אופציונלי)</span>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full rounded-xl border border-primary-100 bg-bg-surface p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </label>

          <label className="flex items-start gap-2 text-sm bg-bg-surface border border-primary-100 rounded-xl p-3">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 w-4 h-4 accent-primary"
              required
            />
            <span>
              אני מאשר שקראתי את{" "}
              <Link href="/terms" className="text-primary underline" target="_blank">
                תנאי השימוש
              </Link>{" "}
              ומתחייב להחזיר את הכלי במצב תקין עד התאריך שבחרתי.
            </span>
          </label>
          {errors.termsAcknowledged?.[0] && (
            <p className="text-xs text-error -mt-2">{errors.termsAcknowledged[0]}</p>
          )}

          {serverError && <Alert variant="error">{serverError}</Alert>}

          <Button onClick={submit} size="lg" loading={loading} disabled={!canSubmit}>
            בקש השאלה
          </Button>
          <p className="text-xs text-text-muted text-center">
            נעילת הפיקדון תופעל ברגע שיוגדר חשבון Cardcom.
          </p>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
