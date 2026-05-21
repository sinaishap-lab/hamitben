import { redirect } from "next/navigation";
import { Gift, UserPlus, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReferralCard } from "../profile/ReferralCard";

export const dynamic = "force-dynamic";

export default async function InvitePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/invite");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      referralCode: true,
      discountTokens: true,
      _count: { select: { referrals: true } },
    },
  });
  if (!me) redirect("/login");

  return (
    <div className="px-4 py-6 flex flex-col gap-5">
      <header className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mb-3">
          <Gift className="w-8 h-8 text-accent" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-primary">הזמן חבר</h1>
        <p className="text-sm text-text-muted mt-1 max-w-xs mx-auto">
          כל חבר שתזמין יעזור לגמח לגדול. כשהוא יבצע השאלה ראשונה — תקבל
          10% הנחה על השאלה הבאה שלך.
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3">
        <Stat
          icon={Users}
          value={me._count.referrals}
          label="חברים שהזמנת"
        />
        <Stat
          icon={Gift}
          value={me.discountTokens}
          label="אסימוני הנחה"
        />
      </section>

      {/* Share card */}
      <ReferralCard code={me.referralCode} discountTokens={me.discountTokens} />

      {/* How it works */}
      <section className="bg-bg-surface rounded-2xl border border-primary-100 p-4 text-sm">
        <h2 className="font-bold mb-2 flex items-center gap-1">
          <UserPlus className="w-4 h-4" aria-hidden />
          איך זה עובד?
        </h2>
        <ol className="list-decimal pr-5 space-y-1 text-text-muted">
          <li>שתף את הקישור האישי שלך עם חברים</li>
          <li>חבר נרשם דרך הקישור ומאושר במערכת</li>
          <li>החבר מבקש השאלה ראשונה — אתה מקבל אסימון הנחה</li>
          <li>בבקשת ההשאלה הבאה שלך, סמן &quot;נצל אסימון&quot; ותקבל 10% הנחה</li>
        </ol>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Gift;
  value: number;
  label: string;
}) {
  return (
    <div className="bg-bg-surface rounded-2xl border border-primary-100 p-4 text-center">
      <Icon className="w-6 h-6 text-primary mx-auto" aria-hidden />
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}
