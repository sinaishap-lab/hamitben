"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";

type FieldErrors = Partial<Record<"name" | "phone" | "subject" | "message", string[]>>;

export function ContactForm() {
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
    const payload = {
      name: form.get("name"),
      phone: form.get("phone"),
      subject: form.get("subject"),
      message: form.get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        return;
      }
      if (data.error === "VALIDATION") {
        setErrors(data.issues as FieldErrors);
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
      <Alert variant="success">
        תודה! ההודעה נשלחה. נחזור אליך בהקדם.
      </Alert>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <FormField label="שם" htmlFor="name" required error={errors.name?.[0]}>
        <Input id="name" name="name" required invalid={!!errors.name} autoComplete="name" />
      </FormField>

      <FormField label="טלפון" htmlFor="phone" required error={errors.phone?.[0]}>
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

      <FormField label="נושא" htmlFor="subject" required error={errors.subject?.[0]}>
        <Input id="subject" name="subject" required invalid={!!errors.subject} />
      </FormField>

      <FormField label="הודעה" htmlFor="message" required error={errors.message?.[0]}>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          maxLength={2000}
          className="w-full rounded-xl border border-primary-100 bg-bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
      </FormField>

      <Button type="submit" loading={loading} size="lg">
        שלח
      </Button>
    </form>
  );
}
