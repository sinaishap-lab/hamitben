"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { cn, formatShekel } from "@/lib/utils";

const PRESET_AMOUNTS = [50, 100, 200, 500];

type FieldErrors = Partial<Record<"amount" | "name" | "email", string[]>>;

export function DonateForm() {
  const [amount, setAmount] = useState<number>(100);
  const [custom, setCustom] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function pickPreset(v: number) {
    setAmount(v);
    setCustom("");
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setServerError(null);

    const finalAmount = custom
      ? parseFloat(custom) || 0
      : amount;
    if (finalAmount < 10) {
      setErrors({ amount: ["מינימום ₪10"] });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          name: name || null,
          email: email || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        return;
      }
      if (data.error === "VALIDATION") {
        setErrors(data.issues as FieldErrors);
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

  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="success">
          תודה רבה על תרומתך! אישור יישלח לאימייל שלך (אם הזנת).
        </Alert>
        <Link
          href="/catalog"
          className="text-primary text-center font-medium underline"
        >
          חזרה לקטלוג
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <fieldset>
        <legend className="text-sm font-medium text-text mb-2">בחר סכום</legend>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((v) => {
            const isActive = !custom && amount === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => pickPreset(v)}
                className={cn(
                  "h-12 rounded-xl border-2 font-bold transition-colors",
                  isActive
                    ? "bg-primary text-text-inverse border-primary"
                    : "bg-bg-surface border-primary-100 hover:border-primary-300"
                )}
              >
                ₪{v}
              </button>
            );
          })}
        </div>
      </fieldset>

      <FormField
        label="או סכום אחר"
        htmlFor="custom"
        hint="מינימום ₪10"
        error={errors.amount?.[0]}
      >
        <Input
          id="custom"
          type="number"
          dir="ltr"
          min={10}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="₪"
          invalid={!!errors.amount}
        />
      </FormField>

      <FormField label="שם (אופציונלי)" htmlFor="name" error={errors.name?.[0]}>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </FormField>

      <FormField label="אימייל (אופציונלי, לקבלה)" htmlFor="email" error={errors.email?.[0]}>
        <Input
          id="email"
          type="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          invalid={!!errors.email}
        />
      </FormField>

      <Button type="submit" loading={loading} size="lg">
        תרום {formatShekel(custom ? parseFloat(custom) || 0 : amount)}
      </Button>
    </form>
  );
}
