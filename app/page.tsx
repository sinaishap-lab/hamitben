import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GuestEntryButton } from "@/components/auth/GuestEntryButton";

export const dynamic = "force-dynamic";

// Spec §8.1 – דף ברוכים הבאים. Guest-only: a logged-in user has no reason to
// see the landing page, so we bounce them to where they actually work.
export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/catalog");
  }

  return (
    <div className="px-4 py-8 flex flex-col gap-8">
      {/* Hero — logo + name + tagline */}
      <section className="text-center pt-2 flex flex-col items-center">
        <div className="w-24 h-24 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            className="w-full h-full rounded-2xl shadow-soft object-contain"
            aria-hidden
          />
        </div>
        <h1 className="text-4xl font-bold text-primary tracking-tight">
          המתבן
        </h1>
        <div className="mt-2 h-0.5 w-12 rounded-full bg-gradient-accent" />
        <p className="mt-3 text-text-muted text-balance text-base max-w-xs">
          גמח כלי עבודה חברתי חקלאי ציוני
        </p>
      </section>

      {/* Hero illustration */}
      <section>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landingillustration.png"
          alt=""
          className="w-full h-auto rounded-2xl shadow-card border border-primary-100/60"
          aria-hidden
        />
      </section>

      {/* CTAs */}
      <section className="flex flex-col gap-3">
        <Link
          href="/login"
          className="w-full h-12 rounded-xl bg-gradient-primary text-text-inverse font-medium flex items-center justify-center gap-2 shadow-soft hover:shadow-glow hover:brightness-110 active:brightness-90 active:scale-[0.98] transition-all"
        >
          כניסה
        </Link>
        <Link
          href="/register"
          className="w-full h-12 rounded-xl border-2 border-primary text-primary font-medium flex items-center justify-center bg-bg-surface hover:bg-primary-50 transition-colors"
        >
          הרשמה
        </Link>
        <GuestEntryButton />
      </section>

      {/* Launch communities (spec §1) */}
      <section className="text-center text-sm text-text-muted">
        <p>פועלים בגמחי</p>
        <p className="font-medium text-text mt-1">
          מזרח הגוש · תלם · דרום הר חברון
        </p>
      </section>
    </div>
  );
}
