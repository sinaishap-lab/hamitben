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
    <div className="px-4 py-6 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-primary">כניסה</h1>
        <p className="text-sm text-text-muted mt-1">
          ברוכים השבים למתבן
        </p>
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

      {/* Who we are — short teaser for first-time visitors */}
      <section className="bg-primary-50/50 rounded-2xl border border-primary-100/60 p-4 flex flex-col gap-2 text-center">
        <h2 className="font-bold text-sm text-primary">מי אנחנו?</h2>
        <p className="text-xs leading-relaxed text-text">
          המתבן הוא פלטפורמה חברתית מבית{" "}
          <span className="font-semibold">קרן ציון לפיתוח</span> — להשאלת
          כלי עבודה חקלאיים בין חברי קהילת החקלאים שלנו בישראל. במקום שכל
          חקלאי יקנה לעצמו מחרשה, מקלטרת או מגוב, אנחנו מאגדים את הכלים
          בגמ&quot;חים שיתופיים — כך לכולם יש את כל הכלים.
        </p>
      </section>

      {/* Illustration — below the form + register link. mix-blend-multiply
          lets the page background show through the image's white pixels,
          simulating a transparent background. */}
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
