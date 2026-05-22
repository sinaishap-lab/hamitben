import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Pencil, MapPin, Phone, Wrench, ClipboardList, Coins } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatShekel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminGemachsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/gemachs");
  if (session.user.role !== "ADMIN") redirect("/");

  const gemachs = await prisma.gemach.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      phone: true,
      isActive: true,
      manager: { select: { id: true, name: true, phone: true } },
      _count: { select: { tools: { where: { isActive: true } } } },
    },
  });

  // Per-gemach activity stats: loan count + total money charged.
  const stats = await Promise.all(
    gemachs.map(async (g) => {
      const agg = await prisma.loan.aggregate({
        where: { tool: { gemachId: g.id } },
        _count: true,
        _sum: { totalCharged: true },
      });
      return {
        gemachId: g.id,
        loanCount: agg._count,
        revenue: agg._sum.totalCharged ?? 0,
      };
    })
  );
  const statByGemach = new Map(stats.map((s) => [s.gemachId, s]));

  // Totals across all gemachs
  const totalTools = gemachs.reduce((sum, g) => sum + g._count.tools, 0);
  const totalLoans = stats.reduce((sum, s) => sum + s.loanCount, 0);
  const totalRevenue = stats.reduce((sum, s) => sum + s.revenue, 0);

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">ניהול גמחים</h1>
        <Link href="/admin/gemachs/new">
          <Button size="sm" className="w-auto">
            <Plus className="w-4 h-4" />
            הוסף גמח
          </Button>
        </Link>
      </header>

      {/* Aggregate totals */}
      <section className="grid grid-cols-3 gap-2 text-center">
        <TotalCard icon={Wrench} value={totalTools} label="כלים" />
        <TotalCard icon={ClipboardList} value={totalLoans} label="השאלות" />
        <TotalCard icon={Coins} value={formatShekel(totalRevenue)} label="סך הכנסות" />
      </section>

      {gemachs.length === 0 ? (
        <p className="text-center text-text-muted py-8">אין גמחים במערכת.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {gemachs.map((g) => {
            const s = statByGemach.get(g.id);
            return (
              <li
                key={g.id}
                className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold">{g.name}</div>
                    <div className="text-xs text-text-muted flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" aria-hidden />
                      {g.address}
                    </div>
                    {g.phone && (
                      <div
                        className="text-xs text-text-muted flex items-center gap-1 mt-0.5"
                        dir="ltr"
                      >
                        <Phone className="w-3 h-3" aria-hidden />
                        {g.phone}
                      </div>
                    )}
                  </div>
                  <Badge variant={g.isActive ? "success" : "neutral"}>
                    {g.isActive ? "פעיל" : "לא פעיל"}
                  </Badge>
                </div>

                {/* Per-gemach stats */}
                <div className="grid grid-cols-3 gap-2">
                  <GemachStat
                    icon={Wrench}
                    value={g._count.tools}
                    label="כלים"
                  />
                  <GemachStat
                    icon={ClipboardList}
                    value={s?.loanCount ?? 0}
                    label="השאלות"
                  />
                  <GemachStat
                    icon={Coins}
                    value={formatShekel(s?.revenue ?? 0)}
                    label="הכנסות"
                  />
                </div>

                <div className="text-xs text-text-muted">
                  מנהל: <span className="text-text">{g.manager.name}</span>
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/gemachs/${g.id}/edit`} className="flex-1">
                    <Button size="sm" variant="outline">
                      <Pencil className="w-4 h-4" />
                      ערוך
                    </Button>
                  </Link>
                  <Link href={`/gemach/${g.id}/dashboard`} className="flex-1">
                    <Button size="sm" variant="ghost">
                      כניסה לניהול
                    </Button>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TotalCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Wrench;
  value: string | number;
  label: string;
}) {
  return (
    <div className="bg-primary text-text-inverse rounded-2xl p-3">
      <Icon className="w-5 h-5 mx-auto opacity-90" aria-hidden />
      <div className="text-lg font-bold mt-1">{value}</div>
      <div className="text-[11px] opacity-80">{label}</div>
    </div>
  );
}

function GemachStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Wrench;
  value: string | number;
  label: string;
}) {
  return (
    <div className="bg-primary-50/60 rounded-xl py-2 text-center">
      <Icon className="w-4 h-4 mx-auto text-primary" aria-hidden />
      <div className="text-sm font-bold mt-0.5">{value}</div>
      <div className="text-[10px] text-text-muted">{label}</div>
    </div>
  );
}
