import Link from "next/link";
import { redirect } from "next/navigation";
import { User, Eye, LogIn, UserPlus } from "lucide-react";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// "Guest profile" — the account screen for visitors who aren't signed in.
// Reached via the guest avatar in the TopBar.
export default async function GuestPage() {
  const session = await auth();
  if (session?.user) redirect("/profile");

  return (
    <div className="px-4 py-8 flex flex-col gap-6">
      <header className="text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-3">
          <User className="w-10 h-10 text-primary" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-primary">אורח</h1>
        <p className="text-sm text-text-muted mt-1">
          אתה גולש כאורח, ללא חשבון.
        </p>
      </header>

      {/* What a guest can / can't do */}
      <section className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex flex-col gap-3 text-sm">
        <div className="flex items-start gap-2">
          <Eye className="w-4 h-4 text-success mt-0.5 shrink-0" aria-hidden />
          <span>כאורח ניתן לעיין בקטלוג הכלים ובדפי הגמחים.</span>
        </div>
        <div className="flex items-start gap-2">
          <LogIn className="w-4 h-4 text-text-muted mt-0.5 shrink-0" aria-hidden />
          <span className="text-text-muted">
            כדי לבקש השאלה, לבחור תאריכים ולעקוב אחרי הבקשות — צריך חשבון.
          </span>
        </div>
      </section>

      {/* CTAs */}
      <section className="flex flex-col gap-3">
        <Link
          href="/login"
          className="w-full h-12 rounded-xl bg-primary text-text-inverse font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <LogIn className="w-4 h-4" aria-hidden />
          כניסה
        </Link>
        <Link
          href="/register"
          className="w-full h-12 rounded-xl border-2 border-primary text-primary font-medium flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" aria-hidden />
          הרשמה
        </Link>
        <Link
          href="/catalog"
          className="w-full h-12 rounded-xl text-text-muted font-medium flex items-center justify-center"
        >
          המשך לעיין בקטלוג
        </Link>
      </section>
    </div>
  );
}
