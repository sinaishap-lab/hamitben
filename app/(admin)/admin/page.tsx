import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  Sprout,
  Wrench,
  Inbox,
  HandCoins,
  Globe,
  Gift,
  ClipboardList,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  const [
    usersPending,
    usersBanned,
    gemachs,
    tools,
    activeLoans,
    pendingLoans,
    toolRequests,
    gemachRequests,
    toolDonations,
    donationsTotal,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING", deletedAt: null } }),
    prisma.user.count({ where: { isBanned: true, deletedAt: null } }),
    prisma.gemach.count({ where: { isActive: true } }),
    prisma.tool.count({ where: { isActive: true } }),
    prisma.loan.count({ where: { status: "ACTIVE" } }),
    prisma.loan.count({ where: { status: "PENDING" } }),
    prisma.toolRequest.count({ where: { status: "PENDING" } }),
    prisma.gemachRequest.count({ where: { status: "PENDING" } }),
    prisma.toolDonationRequest.count({ where: { status: "PENDING" } }),
    prisma.donation.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="px-4 py-6 flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold text-primary">לוח בקרה ראשי</h1>
        <p className="text-sm text-text-muted mt-1">
          ברוך הבא, {session.user.name}
        </p>
      </header>

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-3">
        <Stat icon={Users} value={usersPending} label="משתמשים ממתינים" attention={usersPending > 0} />
        <Stat icon={ClipboardList} value={pendingLoans} label="בקשות השאלה ממתינות" attention={pendingLoans > 0} />
        <Stat icon={Sprout} value={gemachs} label="גמחים פעילים" />
        <Stat icon={Wrench} value={tools} label="כלים פעילים" />
        <Stat icon={Inbox} value={activeLoans} label="השאלות פעילות" />
        <Stat icon={HandCoins} value={`₪${(donationsTotal._sum.amount ?? 0).toLocaleString("he-IL")}`} label="סך תרומות" />
      </section>

      {/* Sections */}
      <section>
        <h2 className="font-bold mb-3 text-sm text-text-muted">ניהול</h2>
        <ul className="flex flex-col gap-2">
          <Tile
            href="/admin/users"
            icon={Users}
            title="משתמשים"
            sub={`${usersPending} ממתינים, ${usersBanned} חסומים`}
            badge={usersPending}
          />
          <Tile
            href="/admin/gemachs"
            icon={Sprout}
            title="גמחים"
            sub={`${gemachs} פעילים`}
          />
          <Tile
            href="/admin/tool-requests"
            icon={Gift}
            title="בקשות כלים חסרים"
            sub={`${toolRequests} ממתינות`}
            badge={toolRequests}
          />
          <Tile
            href="/admin/gemach-requests"
            icon={Globe}
            title="בקשות פתיחת גמח"
            sub={`${gemachRequests} ממתינות`}
            badge={gemachRequests}
          />
          <Tile
            href="/admin/tool-donations"
            icon={Wrench}
            title="הצעות תרומת כלים"
            sub={`${toolDonations} ממתינות`}
            badge={toolDonations}
          />
        </ul>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  attention,
}: {
  icon: typeof Users;
  value: string | number;
  label: string;
  attention?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 text-center ${
        attention
          ? "bg-warning/10 border-warning/40"
          : "bg-bg-surface border-primary-100"
      }`}
    >
      <Icon className={`w-5 h-5 mx-auto ${attention ? "text-warning" : "text-primary"}`} aria-hidden />
      <div className="text-xl font-bold mt-1">{value}</div>
      <div className="text-[11px] text-text-muted">{label}</div>
    </div>
  );
}

function Tile({
  href,
  icon: Icon,
  title,
  sub,
  badge,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  sub: string;
  badge?: number;
}) {
  return (
    <li>
      <Link
        href={href}
        className="bg-bg-surface rounded-2xl border border-primary-100 p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{title}</div>
          <div className="text-xs text-text-muted">{sub}</div>
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="bg-warning text-text text-xs font-bold rounded-full px-2 py-0.5">
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}
