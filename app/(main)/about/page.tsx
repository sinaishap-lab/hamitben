import Link from "next/link";
import { Wheat, HandCoins, Wrench, Sprout, Coins, Users, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "אודות",
  description: "מי אנחנו ולמה הקמנו את המתבן",
};

export default function AboutPage() {
  return (
    <div className="px-4 py-6 flex flex-col gap-6">
      {/* Hero */}
      <header className="text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Wheat className="w-10 h-10 text-primary" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-primary">המתבן</h1>
        <p className="text-sm text-text-muted mt-1 max-w-xs mx-auto">
          חקלאות שיתופית — כי יחד עושים יותר מכל אחד לבד
        </p>
      </header>

      {/* About */}
      <section className="bg-bg-surface rounded-2xl border border-primary-100 p-4">
        <h2 className="font-bold mb-2">מי אנחנו?</h2>
        <p className="text-sm leading-relaxed text-text">
          המתבן הוא פלטפורמה קהילתית להשאלת כלי עבודה חקלאיים בין חברי גמחים
          באזורים שונים. במקום שכל חקלאי יקנה לעצמו מסור, מרסס או חרמש — אנחנו
          מאגדים את הכלים בגמחים שיתופיים, בקרבה לבית.
        </p>
      </section>

      {/* Why */}
      <section>
        <h2 className="font-bold mb-2 text-center">למה המתבן?</h2>
        <div className="grid grid-cols-3 gap-3">
          <Highlight icon={Coins} label="חיסכון" />
          <Highlight icon={Users} label="קהילה" />
          <Highlight icon={Sprout} label="שמירת האדמה" />
        </div>
      </section>

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
    </div>
  );
}

function Highlight({ icon: Icon, label }: { icon: typeof Coins; label: string }) {
  return (
    <div className="rounded-xl bg-bg-surface p-3 border border-primary-100 text-center">
      <Icon className="w-6 h-6 text-primary mx-auto" aria-hidden />
      <div className="text-xs text-text-muted mt-1">{label}</div>
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
        className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
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
