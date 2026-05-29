"use client";

import { useState, type FormEvent, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";

type FieldErrors = Partial<
  Record<"name" | "phone" | "email" | "password" | "termsAccepted", string[]>
>;

function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const referralCode = search.get("ref") || undefined;

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setErrors({});
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email"),
      password: form.get("password"),
      termsAccepted: form.get("termsAccepted") === "on",
      referralCode,
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/pending");
        return;
      }

      if (data.error === "VALIDATION") {
        setErrors(data.issues as FieldErrors);
      } else if (data.error === "DUPLICATE") {
        setErrors({ [data.field]: [data.message] } as FieldErrors);
      } else {
        setServerError("אירעה תקלה. נסה שוב.");
      }
    } catch {
      setServerError("בעיית רשת. נסה שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {referralCode && (
        <Alert variant="info">
          נרשמת דרך הזמנה (קוד: <span className="font-mono">{referralCode}</span>)
        </Alert>
      )}

      {serverError && <Alert variant="error">{serverError}</Alert>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField label="שם מלא" htmlFor="name" required error={errors.name?.[0]}>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            invalid={!!errors.name}
          />
        </FormField>

        <FormField
          label="מספר טלפון"
          htmlFor="phone"
          required
          hint="פורמט: 05XXXXXXXX"
          error={errors.phone?.[0]}
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            required
            invalid={!!errors.phone}
          />
        </FormField>

        <FormField label="אימייל" htmlFor="email" required error={errors.email?.[0]}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            required
            invalid={!!errors.email}
          />
        </FormField>

        <FormField
          label="סיסמה"
          htmlFor="password"
          required
          hint="לפחות 8 תווים"
          error={errors.password?.[0]}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            invalid={!!errors.password}
          />
        </FormField>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="termsAccepted"
            required
            className="mt-1 w-4 h-4 accent-primary"
          />
          <span>
            קראתי ואני מסכים/ה ל
            <Link href="/terms" className="text-primary underline mx-1">
              תנאי השימוש
            </Link>
          </span>
        </label>
        {errors.termsAccepted?.[0] && (
          <p className="text-xs text-error -mt-2" role="alert">
            {errors.termsAccepted[0]}
          </p>
        )}

        <Button type="submit" loading={loading} size="lg">
          הרשמה
        </Button>
      </form>
    </>
  );
}

export default function RegisterPage() {
  return (
    <div className="px-4 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-primary">הרשמה</h1>
        <p className="text-sm text-text-muted mt-1">
          לאחר הרשמה הבקשה תועבר לאישור מנהל ראשי
        </p>
      </header>

      <Suspense fallback={<div className="text-text-muted">טוען...</div>}>
        <RegisterForm />
      </Suspense>

      <p className="text-center text-sm text-text-muted">
        כבר רשום?{" "}
        <Link href="/login" className="text-primary font-medium">
          התחבר
        </Link>
      </p>

      {/* Illustration — below the form + login link, full opacity.
          mix-blend-multiply lets the page background show through the
          image's white pixels, mimicking a transparent background.
          Lazy loaded (below fold) — no priority needed. */}
      <Image
        src="/harshamapage.png"
        alt=""
        aria-hidden
        width={480}
        height={480}
        className="w-full h-auto mix-blend-multiply"
      />
    </div>
  );
}
