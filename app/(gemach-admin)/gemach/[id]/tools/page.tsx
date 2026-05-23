import Link from "next/link";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { Plus, Pencil, QrCode, Sprout } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TOOL_STATUS } from "@/lib/labels";
import { formatShekel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GemachToolsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const gemach = await prisma.gemach.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, managerId: true },
  });
  if (!gemach) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = gemach.managerId === session.user.id;
  if (!isAdmin && !isOwner) redirect("/");

  const tools = await prisma.tool.findMany({
    where: { gemachId: gemach.id, isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: { select: { name: true } },
      images: true,
      status: true,
      depositAmount: true,
      dailyRate: true,
      autoApprove: true,
    },
  });

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">כלים</h1>
          <p className="text-sm text-text-muted">{gemach.name}</p>
        </div>
        <Link href={`/gemach/${gemach.id}/tools/new`}>
          <Button size="sm" className="w-auto">
            <Plus className="w-4 h-4" />
            הוסף כלי
          </Button>
        </Link>
      </header>

      {tools.length === 0 ? (
        <div className="text-center py-10 flex flex-col items-center gap-3">
          <Sprout className="w-10 h-10 text-primary-300" aria-hidden />
          <p className="text-text-muted">עדיין אין כלים בגמח.</p>
          <Link href={`/gemach/${gemach.id}/tools/new`}>
            <Button size="md" className="w-auto">
              הוסף את הכלי הראשון
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {tools.map((t) => (
            <li
              key={t.id}
              className="bg-bg-surface rounded-2xl border border-primary-100 p-3 flex gap-3"
            >
              <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-bg border border-primary-50">
                {t.images[0] ? (
                  <Image
                    src={t.images[0]}
                    alt={t.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                    אין תמונה
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{t.name}</div>
                    <div className="text-xs text-text-muted">
                      {t.category.name}
                    </div>
                  </div>
                  <Badge
                    variant={
                      t.status === "AVAILABLE"
                        ? "success"
                        : t.status === "LOANED"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {TOOL_STATUS[t.status]}
                  </Badge>
                </div>

                <div className="text-xs text-text-muted mt-1">
                  פיקדון {formatShekel(t.depositAmount)} · {formatShekel(t.dailyRate)}/יום
                  {t.autoApprove && (
                    <span className="mr-2 text-primary">· אישור אוטומטי</span>
                  )}
                </div>

                <div className="flex gap-1.5 mt-2">
                  <Link
                    href={`/gemach/${gemach.id}/tools/${t.id}/edit`}
                    className="flex-1"
                  >
                    <Button size="sm" variant="outline">
                      <Pencil className="w-3.5 h-3.5" />
                      ערוך
                    </Button>
                  </Link>
                  <Link
                    href={`/gemach/${gemach.id}/tools/${t.id}/qr`}
                    className="flex-1"
                  >
                    <Button size="sm" variant="ghost">
                      <QrCode className="w-3.5 h-3.5" />
                      QR
                    </Button>
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
