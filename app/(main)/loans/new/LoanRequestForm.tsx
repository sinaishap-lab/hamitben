"use client";

import { useState, useMemo, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { formatShekel } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

function todayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
function addDaysIso(base: string, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type FieldErrors = Partial<
  Record<"startDate" | "endDate" | "purpose" | "termsAcknowledged", string[]>
>;

export function LoanRequestForm({
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
  const today = todayIso();

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [purpose, setPurpose] = useState("");
  const [terms, setTerms] = useState(false);
  const [useToken, setUseToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const days = useMemo(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    return Math.max(
      1,
      Math.round((e.getTime() - s.getTime()) / DAY_MS) + 1
    );
  }, [startDate, endDate]);

  const grossTotal = useMemo(
    () => Math.round(dailyRate * days * 100) / 100,
    [dailyRate, days]
  );
  const discounted = useMemo(
    () =>
      useToken
        ? Math.round(dailyRate * days * 0.9 * 100) / 100
        : grossTotal,
    [useToken, dailyRate, days, grossTotal]
  );

  const maxEndDate = useMemo(
    () => addDaysIso(startDate, maxDays - 1),
    [startDate, maxDays]
  );

  const overMax = days > maxDays;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setServerError(null);

    if (!terms) {
      setErrors({ termsAcknowledged: ["יש לאשר את תנאי השאלה"] });
      setLoading(false);
      return;
    }
    if (overMax) {
      setErrors({ endDate: [`ניתן להשאיל עד ${maxDays} ימים`] });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId,
          startDate,
          endDate,
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
      if (data.error === "VALIDATION") {
        setErrors(data.issues as FieldErrors);
      } else if (data.error === "CONFLICT") {
        setServerError(data.message ?? "התאריכים שבחרת תפוסים");
      } else if (data.message) {
        setServerError(data.message);
      } else {
        setServerError("שליחה נכשלה");
      }
    } catch {
      setServerError("בעיית רשת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <FormField
        label="תאריך התחלה"
        htmlFor="startDate"
        required
        error={errors.startDate?.[0]}
      >
        <Input
          id="startDate"
          type="date"
          dir="ltr"
          min={today}
          value={startDate}
          onChange={(e) => {
            const v = e.target.value;
            setStartDate(v);
            if (endDate < v) setEndDate(v);
          }}
          invalid={!!errors.startDate}
          required
        />
      </FormField>

      <FormField
        label="תאריך סיום"
        htmlFor="endDate"
        required
        hint={`עד ${maxDays} ימים`}
        error={errors.endDate?.[0]}
      >
        <Input
          id="endDate"
          type="date"
          dir="ltr"
          min={startDate}
          max={maxEndDate}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          invalid={!!errors.endDate || overMax}
          required
        />
      </FormField>

      {/* Discount token offer (§16.2) */}
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
              נצל אסימון הנחה (10% הנחה)
            </span>
            <span className="text-xs text-text-muted block">
              יש לך {discountTokens} אסימוני הנחה. במידה ותבטל את הבקשה, האסימון יוחזר.
            </span>
          </span>
        </label>
      )}

      {/* Live summary */}
      <div className="bg-primary-50/50 rounded-xl p-3 text-sm flex flex-col gap-1">
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

      <FormField label="מטרת השימוש (אופציונלי)" htmlFor="purpose" error={errors.purpose?.[0]}>
        <textarea
          id="purpose"
          rows={2}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          maxLength={300}
          className="w-full rounded-xl border border-primary-100 bg-bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
      </FormField>

      {/* Terms checkbox – spec §15.2 per-loan acknowledgement */}
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
        <p className="text-xs text-error -mt-2" role="alert">
          {errors.termsAcknowledged[0]}
        </p>
      )}

      <Button type="submit" loading={loading} size="lg" disabled={!terms || overMax}>
        אישור בקשה
      </Button>
      <p className="text-xs text-text-muted text-center">
        נעילת הפיקדון בכרטיס תופעל ברגע שיוגדר חשבון Cardcom. כרגע הבקשה נשלחת ללא חיוב בפועל.
      </p>
    </form>
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
