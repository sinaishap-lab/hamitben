import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "צור קשר",
  description: "פנייה לצוות המתבן",
};

export default function ContactPage() {
  return (
    <div className="px-4 py-6 flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold text-primary">צור קשר</h1>
        <p className="text-sm text-text-muted mt-1">
          יש לך שאלה? הצעה? נשמח לשמוע. נחזור אליך בהקדם.
        </p>
      </header>
      <ContactForm />
    </div>
  );
}
