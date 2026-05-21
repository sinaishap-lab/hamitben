"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";

type FieldErrors = Partial<Record<"donorName" | "donorPhone" | "toolDesc", string[]>>;

export function NewToolDonationForm() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setServerError(null);

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/tool-donation-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: form.get("donorName"),
          donorPhone: form.get("donorPhone"),
          toolDesc: form.get("toolDesc"),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        return;
      }
      if (data.error === "VALIDATION") setErrors(data.issues as FieldErrors);
      else setServerError("שליחה נכשלה");
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
          תודה רבה! נחזור אליך בקרוב לתיאום איסוף.
        </Alert>
        <Link
          href="/about"
          className="text-primary text-center font-medium underline"
        >
          חזרה לדף אודות
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <FormField label="שם מלא" htmlFor="donorName" required error={errors.donorName?.[0]}>
        <Input id="donorName" name="donorName" required invalid={!!errors.donorName} autoComplete="name" />
      </FormField>

      <FormField
        label="טלפון"
        htmlFor="donorPhone"
        required
        hint="פורמט: 05XXXXXXXX"
        error={errors.donorPhone?.[0]}
      >
        <Input
          id="donorPhone"
          name="donorPhone"
          type="tel"
          dir="ltr"
          required
          invalid={!!errors.donorPhone}
          autoComplete="tel"
        />
      </FormField>

      <FormField
        label="תאר את הכלי"
        htmlFor="toolDesc"
        required
        hint="סוג, מצב, פרטים מזהים"
        error={errors.toolDesc?.[0]}
      >
        <textarea
          id="toolDesc"
          name="toolDesc"
          rows={4}
          required
          maxLength={500}
          className="w-full rounded-xl border border-primary-100 bg-bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
      </FormField>

      <Button type="submit" loading={loading} size="lg">
        שלח הצעה
      </Button>
    </form>
  );
}
