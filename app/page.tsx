import Link from "next/link";
import { redirect } from "next/navigation";
import { Wheat } from "lucide-react";
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
    <div className="px-4 py-8 flex flex-col gap-10">
      {/* Hero */}
      <section className="text-center pt-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Wheat className="w-10 h-10 text-primary" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold text-primary">המתבן</h1>
        <p className="mt-2 text-text-muted text-balance">
          גמח כלי עבודה חקלאיים – יחד עושים יותר מכל אחד לבד
        </p>
      </section>

      {/* CTAs */}
      <section className="flex flex-col gap-3">
        <Link
          href="/login"
          className="w-full h-12 rounded-xl bg-primary text-text-inverse font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          כניסה
        </Link>
        <Link
          href="/register"
          className="w-full h-12 rounded-xl border-2 border-primary text-primary font-medium flex items-center justify-center"
        >
          הרשמה
        </Link>
        <GuestEntryButton />
      </section>

      {/* Highlights – per spec §18 about page intent */}
      <section className="grid grid-cols-3 gap-3 text-center text-xs">
        <div className="rounded-xl bg-bg-surface p-3 border border-primary-100">
          <div className="text-2xl mb-1" aria-hidden>
            💰
          </div>
          <div className="text-text-muted">חיסכון</div>
        </div>
        <div className="rounded-xl bg-bg-surface p-3 border border-primary-100">
          <div className="text-2xl mb-1" aria-hidden>
            🤝
          </div>
          <div className="text-text-muted">קהילה</div>
        </div>
        <div className="rounded-xl bg-bg-surface p-3 border border-primary-100">
          <div className="text-2xl mb-1" aria-hidden>
            🌱
          </div>
          <div className="text-text-muted">שמירת האדמה</div>
        </div>
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
