import { HandCoins } from "lucide-react";
import type { Metadata } from "next";
import { DonateForm } from "./DonateForm";

export const metadata: Metadata = {
  title: "תרומה",
  description: "תרומה למתבן – עוזרים לרכוש כלים חדשים לגמחים",
};

export default function DonatePage() {
  return (
    <div className="px-4 py-6 flex flex-col gap-5">
      <header className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mb-3">
          <HandCoins className="w-8 h-8 text-accent" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-primary">תרומה למתבן</h1>
        <p className="text-sm text-text-muted mt-1 max-w-xs mx-auto">
          התרומה שלך עוזרת לרכוש כלים חדשים, להרחיב גמחים קיימים, ולפתוח גמחים
          במקומות נוספים.
        </p>
      </header>

      <DonateForm />

      <p className="text-xs text-text-muted text-center">
        החיוב מאובטח ומתבצע דרך Cardcom. אישור יישלח לאימייל אם תזין כתובת.
      </p>
    </div>
  );
}
