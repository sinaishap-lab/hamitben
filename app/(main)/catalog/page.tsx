import { Suspense } from "react";
import Link from "next/link";
import type { Prisma, ToolCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ToolCard } from "@/components/tools/ToolCard";
import { ToolFilters } from "@/components/tools/ToolFilters";
import { Button } from "@/components/ui/Button";
import { computeNextFree } from "@/lib/availability";
import { formatDateHe } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const NEW_TOOL_DAYS = 14; // tools added within this window get a "חדש" badge
const IN_DEMAND_LOANS = 5; // loan count at/above which a tool is "מבוקש"

type SearchParams = {
  q?: string;
  category?: string;
  gemach?: string;
  avail?: string; // "today" | "tomorrow"
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = searchParams.q?.trim();
  const category = searchParams.category;
  const gemachId = searchParams.gemach;
  const avail = searchParams.avail;

  const where: Prisma.ToolWhereInput = {
    isActive: true,
    ...(category ? { category: category as ToolCategory } : {}),
    ...(gemachId ? { gemachId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const today = startOfDay(new Date());

  // Availability filter — tool free on today / tomorrow
  if (avail === "today" || avail === "tomorrow") {
    const target = startOfDay(
      new Date(Date.now() + (avail === "tomorrow" ? DAY_MS : 0))
    );
    where.status = { notIn: ["MAINTENANCE", "INACTIVE"] };
    where.loans = {
      none: {
        status: { in: ["APPROVED", "ACTIVE"] },
        startDate: { lte: target },
        endDate: { gte: target },
      },
    };
  }

  const session = await auth();
  const userId = session?.user?.id;

  const [tools, gemachs, favorites] = await Promise.all([
    prisma.tool.findMany({
      where,
      orderBy: { createdAt: "desc" }, // newest first
      select: {
        id: true,
        name: true,
        category: true,
        images: true,
        status: true,
        depositAmount: true,
        dailyRate: true,
        createdAt: true,
        gemach: { select: { id: true, name: true } },
        _count: { select: { waitlist: true, loans: true } },
      },
    }),
    prisma.gemach.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    userId
      ? prisma.favorite.findMany({
          where: { userId },
          select: { toolId: true },
        })
      : Promise.resolve([] as { toolId: string }[]),
  ]);

  const toolIds = tools.map((t) => t.id);

  const [reviewAgg, busyLoans] = await Promise.all([
    toolIds.length
      ? prisma.review.groupBy({
          by: ["toolId"],
          where: { toolId: { in: toolIds }, type: "TOOL" },
          _avg: { rating: true },
          _count: true,
        })
      : Promise.resolve([]),
    toolIds.length
      ? prisma.loan.findMany({
          where: {
            toolId: { in: toolIds },
            status: { in: ["APPROVED", "ACTIVE"] },
            endDate: { gte: today },
          },
          select: { toolId: true, startDate: true, endDate: true },
        })
      : Promise.resolve([]),
  ]);

  const favSet = new Set(favorites.map((f) => f.toolId));

  const ratingByTool = new Map<string, { avg: number; count: number }>();
  for (const r of reviewAgg) {
    if (r.toolId) {
      ratingByTool.set(r.toolId, {
        avg: r._avg.rating ?? 0,
        count: r._count,
      });
    }
  }

  const busyByTool = new Map<string, { startDate: Date; endDate: Date }[]>();
  for (const l of busyLoans) {
    const arr = busyByTool.get(l.toolId) ?? [];
    arr.push({ startDate: l.startDate, endDate: l.endDate });
    busyByTool.set(l.toolId, arr);
  }

  const newThreshold = Date.now() - NEW_TOOL_DAYS * DAY_MS;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary text-center">
          קטלוג כלים
        </h1>
      </header>

      <Suspense fallback={<div className="text-text-muted">טוען סינון...</div>}>
        <ToolFilters gemachs={gemachs} />
      </Suspense>

      {tools.length === 0 ? (
        <div className="text-center py-10 text-text-muted">
          לא נמצאו כלים התואמים לסינון.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {tools.map((tool) => {
            const busy = busyByTool.get(tool.id) ?? [];
            const nextFree = computeNextFree(busy, today);
            const isBusy = nextFree.getTime() > today.getTime();
            return (
              <li key={tool.id}>
                <ToolCard
                  tool={tool}
                  isNew={tool.createdAt.getTime() > newThreshold}
                  inDemand={
                    tool._count.waitlist > 0 ||
                    tool._count.loans >= IN_DEMAND_LOANS
                  }
                  nextFreeLabel={
                    isBusy ? `מתפנה ב-${formatDateHe(nextFree)}` : undefined
                  }
                  rating={ratingByTool.get(tool.id)}
                  favorite={userId ? favSet.has(tool.id) : undefined}
                />
              </li>
            );
          })}
        </ul>
      )}

      {/* Missing-tool prompt (spec §20.4) */}
      <section className="mt-4 bg-primary-50/50 rounded-2xl p-4 text-center">
        <p className="text-sm text-text">לא מצאת מה שחיפשת?</p>
        <Link href="/tool-requests/new" className="mt-2 inline-block">
          <Button size="sm" variant="outline" className="w-auto">
            בקש כלי חסר
          </Button>
        </Link>
      </section>
    </div>
  );
}
