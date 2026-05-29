"use client";

import { useState, type FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { normalizeIsraeliPhone } from "@/lib/validation";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const phone = normalizeIsraeliPhone(String(form.get("phone") || ""));
    const password = String(form.get("password") || "");

    const result = await signIn("credentials", {
      phone,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setError("טלפון או סיסמה שגויים");
      setLoading(false);
      return;
    }

    // Decide destination based on status
    const session = await getSession();
    const status = session?.user?.status;
    const banned = session?.user?.isBanned;

    if (status === "PENDING") {
      router.push("/pending");
      return;
    }
    if (status === "REJECTED" || status === "SUSPENDED") {
      router.push(`/account-blocked?status=${status}`);
      return;
    }
    if (banned) {
      router.push("/account-blocked?status=BANNED");
      return;
    }

    // Default sign-in → personal welcome screen. If the user was sent to
    // login from a specific page, honour that instead (skip the greeting).
    const dest = callbackUrl && callbackUrl !== "/" ? callbackUrl : "/welcome";
    router.push(dest);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <FormField
        label="מספר טלפון"
        htmlFor="phone"
        required
        hint="הטלפון שאיתו נרשמת"
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          required
        />
      </FormField>

      <FormField label="סיסמה" htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </FormField>

      <Button type="submit" loading={loading} size="lg">
        כניסה
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="px-4 py-6 flex flex-col gap-8">

      {/* מי אנחנו — כותרת גדולה + טקסט חופשי + לוגואים */}
      <section className="flex flex-col gap-4 text-center">
        <h1 className="text-3xl font-bold text-primary tracking-tight">
          מי אנחנו
        </h1>
        <p className="text-sm leading-relaxed text-text">
          המתבן הוא פלטפורמה חברתית מבית{" "}
          <span className="font-bold text-primary">קרן ציון לפיתוח</span> —
          להשאלת כלי עבודה חקלאיים בין חברי קהילת החקלאים שלנו בישראל.
          במקום שכל חקלאי יקנה לעצמו מחרשה, מקלטרת או מגוב, אנחנו מאגדים
          את הכלים בגמ&quot;חים שיתופיים — כך לכולם יש את כל הכלים.
        </p>
        <div className="flex items-center justify-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rogum.jpeg"
            alt="רוג'ום — יזמות ציונית (ע״ר)"
            className="h-16 w-auto object-contain mix-blend-multiply"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kerenzion.jpeg"
            alt="קרן ציון לפיתוח"
            className="h-16 w-auto object-contain mix-blend-multiply"
          />
        </div>
      </section>

      {/* טופס כניסה בקופסה עם רקע */}
      <section className="bg-bg-surface rounded-2xl border border-primary-100 shadow-card p-5 flex flex-col gap-5">
        <header>
          <h2 className="text-xl font-bold text-primary">כניסה</h2>
          <p className="text-sm text-text-muted mt-0.5">ברוכים השבים למתבן</p>
        </header>

        <Suspense fallback={<div className="text-text-muted">טוען...</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-text-muted">
          עדיין לא רשום?{" "}
          <Link href="/register" className="text-primary font-medium">
            הרשמה
          </Link>
        </p>
      </section>

      {/* Illustration */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/dafknisa.png"
        alt=""
        aria-hidden
        className="w-full h-auto mix-blend-multiply"
      />
    </div>
  );
}
