import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, Wrench, Settings } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ToolCard } from "@/components/tools/ToolCard";
import { Button } from "@/components/ui/Button";
import { ShareGemachButton } from "./ShareGemachButton";

export const dynamic = "force-dynamic";

export default async function PublicGemachPage({
  params,
}: {
  params: { id: string };
}) {
  const gemach = await prisma.gemach.findFirst({
    where: { id: params.id, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      lat: true,
      lng: true,
      phone: true,
      managerId: true,
      tools: {
        where: { isActive: true },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 24,
        select: {
          id: true,
          name: true,
          category: true,
          images: true,
          status: true,
          depositAmount: true,
          dailyRate: true,
          gemach: { select: { id: true, name: true } },
        },
      },
      _count: { select: { tools: { where: { isActive: true } } } },
    },
  });
  if (!gemach) notFound();

  const session = await auth();
  const canManage =
    session?.user?.role === "ADMIN" || session?.user?.id === gemach.managerId;

  const mapsUrl =
    gemach.lat != null && gemach.lng != null
      ? `https://www.google.com/maps?q=${gemach.lat},${gemach.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gemach.address)}`;

  return (
    <div className="px-4 py-4 flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold text-primary">{gemach.name}</h1>
        {gemach.description && (
          <p className="text-sm text-text-muted mt-1">{gemach.description}</p>
        )}
      </header>

      {/* Contact + location */}
      <section className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex flex-col gap-2">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm"
        >
          <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden />
          <span>{gemach.address}</span>
        </a>
        {gemach.phone && (
          <a
            href={`tel:${gemach.phone}`}
            dir="ltr"
            className="flex items-center gap-2 text-sm text-primary"
          >
            <Phone className="w-4 h-4 shrink-0" aria-hidden />
            {gemach.phone}
          </a>
        )}
      </section>

      {/* Actions */}
      <section className="flex flex-col gap-2">
        <ShareGemachButton
          gemachName={gemach.name}
          description={gemach.description}
          toolsCount={gemach._count.tools}
        />
        {canManage && (
          <Link href={`/gemach/${gemach.id}/dashboard`}>
            <Button variant="outline" size="md">
              <Settings className="w-4 h-4" />
              לוח בקרה של הגמח
            </Button>
          </Link>
        )}
      </section>

      {/* Tools */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold flex items-center gap-1.5">
            <Wrench className="w-4 h-4" aria-hidden />
            כלים בגמח
          </h2>
          <span className="text-xs text-text-muted">
            {gemach._count.tools} כלים
          </span>
        </div>

        {gemach.tools.length === 0 ? (
          <p className="text-center text-text-muted py-6 text-sm">
            עדיין אין כלים בגמח.
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3">
              {gemach.tools.map((t) => (
                <li key={t.id}>
                  <ToolCard tool={t} />
                </li>
              ))}
            </ul>
            {gemach._count.tools > gemach.tools.length && (
              <div className="text-center mt-4">
                <Link
                  href={`/catalog?gemach=${gemach.id}`}
                  className="text-primary text-sm font-medium underline"
                >
                  לכל {gemach._count.tools} הכלים בקטלוג ←
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
