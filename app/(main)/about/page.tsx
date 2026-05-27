import Link from "next/link";
import { HandCoins, Wrench, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "אודות",
  description: "מי אנחנו ולמה הקמנו את המתבן",
};

export default function AboutPage() {
  return (
    <div className="px-4 py-6 flex flex-col gap-6">
      {/* מי אנחנו — page title */}
      <header className="text-center flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold text-primary tracking-tight">
          מי אנחנו
        </h1>
        <div className="h-0.5 w-12 rounded-full bg-gradient-accent" />
      </header>

      {/* About copy */}
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-text text-center max-w-md mx-auto">
        <p>
          המתבן הוא פלטפורמה חברתית מבית{" "}
          <span className="font-bold text-primary">קרן ציון לפיתוח</span> —
          להשאלת כלי עבודה חקלאיים בין חברי קהילת החקלאים שלנו בישראל.
        </p>
        <p>
          במקום שכל חקלאי יקנה לעצמו מחרשה, מקלטרת או מגוב, אנחנו מאגדים
          את הכלים בגמ&quot;חים שיתופיים. כך — לכל החקלאים יש את כל הכלים
          כדי לעשות מקסימום חקלאות על מקסימום שטח.
        </p>
        <p className="font-bold text-primary">תצטרפו אלינו!</p>
      </div>

      {/* Organization logos — above the CTAs */}
      <div className="flex items-center justify-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rogum.jpeg"
          alt="רוג'ום — יזמות ציונית (ע״ר)"
          className="h-24 w-auto object-contain mix-blend-multiply"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kerenzion.jpeg"
          alt="קרן ציון לפיתוח"
          className="h-24 w-auto object-contain mix-blend-multiply"
        />
      </div>

      {/* Take part */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-primary-100" />
          <h2 className="font-bold text-sm text-text-muted">איך לקחת חלק</h2>
          <div className="h-px flex-1 bg-primary-100" />
        </div>

        <ul className="flex flex-col gap-3">
          <CtaTile
            href="/donate"
            icon={HandCoins}
            title="תרומה כספית"
            sub="תמיכה ברכישת כלים חדשים לגמחים"
          />
          <CtaTile
            href="/tool-donations/new"
            icon={Wrench}
            title="תרומת כלים"
            sub="יש לך כלי שאתה רוצה לתרום לגמח?"
          />
          <CtaTile
            href="/gemach-requests/new"
            icon={Globe}
            title="פתח גמח באזור שלך"
            sub="קהילה שצריכה גמח חקלאי משלה"
          />
        </ul>
      </section>

      {/* Communities */}
      <section className="text-center text-sm text-text-muted">
        <p>פועלים בגמחי</p>
        <p className="font-medium text-text mt-1">
          מזרח הגוש · תלם · דרום הר חברון
        </p>
      </section>

      {/* Parent organization — behind HaMatben */}
      <section className="mt-2 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 w-full">
          <div className="h-px flex-1 bg-primary-100" />
          <h2 className="font-bold text-sm text-text-muted">מאחורי המתבן</h2>
          <div className="h-px flex-1 bg-primary-100" />
        </div>
        <p className="text-sm leading-relaxed text-text text-center max-w-md mx-auto">
          המתבן פועל תחת עמותת{" "}
          <span className="font-bold text-primary">רוג&apos;ום (ע״ר)</span>,
          במסגרת{" "}
          <span className="font-bold text-primary">קרן ציון</span> לפיתוח
          חקלאות, התיישבות וקהילה.
        </p>
      </section>
    </div>
  );
}

function CtaTile({
  href,
  icon: Icon,
  title,
  sub,
}: {
  href: string;
  icon: typeof HandCoins;
  title: string;
  sub: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="bg-bg-surface rounded-2xl border border-primary-100/60 shadow-card hover:shadow-glow p-4 flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold">{title}</div>
          <div className="text-xs text-text-muted">{sub}</div>
        </div>
      </Link>
    </li>
  );
}
