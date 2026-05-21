import Link from "next/link";
import { Clock } from "lucide-react";
import { Alert } from "@/components/ui/Alert";

export default function PendingPage() {
  return (
    <div className="px-4 py-10 flex flex-col items-center gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
        <Clock className="w-10 h-10 text-accent" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold text-primary">בקשתך התקבלה</h1>
      <Alert variant="info" className="text-right">
        ההרשמה שלך התקבלה ומחכה לאישור מנהל ראשי. נחזור אליך בהקדם.
        בינתיים ניתן לעיין בקטלוג הכלים.
      </Alert>
      <Link
        href="/catalog"
        className="text-primary font-medium underline"
      >
        עבור לקטלוג
      </Link>
    </div>
  );
}
