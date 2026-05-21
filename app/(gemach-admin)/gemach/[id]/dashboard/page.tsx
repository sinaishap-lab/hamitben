import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Settings, Wrench, Inbox, Package } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GemachDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const gemach = await prisma.gemach.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      managerId: true,
      _count: { select: { tools: true } },
    },
  });
  if (!gemach) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = gemach.managerId === session.user.id;
  if (!isAdmin && !isOwner) redirect("/");

  // Quick counters – Phase 4 will fill these in with real data
  const [pendingLoans, activeLoans] = await Promise.all([
    prisma.loan.count({
      where: { tool: { gemachId: gemach.id }, status: "PENDING" },
    }),
    prisma.loan.count({
      where: { tool: { gemachId: gemach.id }, status: "ACTIVE" },
    }),
  ]);

  const cards = [
    {
      href: `/gemach/${gemach.id}/tools`,
      icon: Wrench,
      title: "כלים",
      sub: `${gemach._count.tools} כלים`,
    },
    {
      href: `/gemach/${gemach.id}/loans`,
      icon: Inbox,
      title: "בקשות",
      sub: `${pendingLoans} ממתינות`,
    },
    {
      href: `/gemach/${gemach.id}/loans?status=ACTIVE`,
      icon: Package,
      title: "השאלות פעילות",
      sub: `${activeLoans} כעת בשטח`,
    },
    {
      href: `/gemach/${gemach.id}/settings`,
      icon: Settings,
      title: "הגדרות",
      sub: "שם, כתובת, מיקום",
    },
  ];

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">{gemach.name}</h1>
        <p className="text-sm text-text-muted mt-1">לוח בקרה גמח</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ href, icon: Icon, title, sub }) => (
          <Link
            key={href}
            href={href}
            className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex flex-col gap-1 active:scale-[0.98] transition-transform"
          >
            <Icon className="w-6 h-6 text-primary" aria-hidden />
            <div className="font-bold mt-1">{title}</div>
            <div className="text-xs text-text-muted">{sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
