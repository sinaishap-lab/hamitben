import type { Metadata } from "next";
import { Sprout } from "lucide-react";
import { NewGemachRequestForm } from "./NewGemachRequestForm";

export const metadata: Metadata = {
  title: "פתח גמח באזור שלך",
};

export default function NewGemachRequestPage() {
  return (
    <div className="px-4 py-6 flex flex-col gap-5">
      <header className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Sprout className="w-8 h-8 text-primary" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-primary">פתח גמח באזור שלך</h1>
        <p className="text-sm text-text-muted mt-1 max-w-xs mx-auto">
          השאר שם וטלפון, ואחד מהצוות יחזור אליך תוך 48 שעות לבירור פרטים
          וליווי בהקמת הגמח.
        </p>
      </header>

      <NewGemachRequestForm />
    </div>
  );
}
