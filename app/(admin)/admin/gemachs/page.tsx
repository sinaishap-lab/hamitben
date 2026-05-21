import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Pencil, MapPin, Phone } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
      _count: { select: { tools: true } },
    },
  });

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

      {gemachs.length === 0 ? (
        <p className="text-center text-text-muted py-8">אין גמחים במערכת.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {gemachs.map((g) => (
            <li
              key={g.id}
              className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{g.name}</div>
                  <div className="text-xs text-text-muted flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" aria-hidden />
                    {g.address}
                  </div>
                  {g.phone && (
                    <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5" dir="ltr">
                      <Phone className="w-3 h-3" aria-hidden />
                      {g.phone}
                    </div>
                  )}
                </div>
                <Badge variant={g.isActive ? "success" : "neutral"}>
                  {g.isActive ? "פעיל" : "לא פעיל"}
                </Badge>
              </div>

              <div className="text-xs text-text-muted">
                מנהל: <span className="text-text">{g.manager.name}</span>
                <span className="mx-1">·</span>
                {g._count.tools} כלים
              </div>

              <div className="flex gap-2 mt-1">
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
          ))}
        </ul>
      )}
    </div>
  );
}
