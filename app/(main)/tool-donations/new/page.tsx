import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { NewToolDonationForm } from "./NewToolDonationForm";

export const metadata: Metadata = {
  title: "תרומת כלי",
};

export default function NewToolDonationPage() {
  return (
    <div className="px-4 py-6 flex flex-col gap-5">
      <header className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Wrench className="w-8 h-8 text-primary" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-primary">תרומת כלי לגמח</h1>
        <p className="text-sm text-text-muted mt-1 max-w-xs mx-auto">
          יש לך כלי חקלאי שאתה רוצה לתרום? תאר אותו ואנחנו נצור איתך קשר לתיאום
          איסוף.
        </p>
      </header>

      <NewToolDonationForm />
    </div>
  );
}
