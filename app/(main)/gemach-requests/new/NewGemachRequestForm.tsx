"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";

type FieldErrors = Partial<Record<"name" | "phone", string[]>>;

export function NewGemachRequestForm() {
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
      const res = await fetch("/api/gemach-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
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
          תודה! בקשתך התקבלה. נחזור אליך תוך 48 שעות.
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

      <FormField label="שם מלא" htmlFor="name" required error={errors.name?.[0]}>
        <Input id="name" name="name" required invalid={!!errors.name} autoComplete="name" />
      </FormField>

      <FormField
        label="טלפון"
        htmlFor="phone"
        required
        hint="פורמט: 05XXXXXXXX"
        error={errors.phone?.[0]}
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          dir="ltr"
          required
          invalid={!!errors.phone}
          autoComplete="tel"
        />
      </FormField>

      <Button type="submit" loading={loading} size="lg">
        שלח בקשה
      </Button>
    </form>
  );
}
