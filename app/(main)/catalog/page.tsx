import { Suspense } from "react";
import Link from "next/link";
import type { Prisma, ToolCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ToolCard } from "@/components/tools/ToolCard";
import { ToolFilters } from "@/components/tools/ToolFilters";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  category?: string;
  gemach?: string;
  available?: string;
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = searchParams.q?.trim();
  const category = searchParams.category;
  const gemachId = searchParams.gemach;
  const availableOnly = searchParams.available === "1";

  const where: Prisma.ToolWhereInput = {
    isActive: true,
    ...(category ? { category: category as ToolCategory } : {}),
    ...(gemachId ? { gemachId } : {}),
    ...(availableOnly ? { status: "AVAILABLE" } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [tools, gemachs] = await Promise.all([
    prisma.tool.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
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
    }),
    prisma.gemach.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">קטלוג כלים</h1>
        <p className="text-sm text-text-muted">
          {tools.length === 1 ? "כלי אחד" : `${tools.length} כלים`} זמינים
        </p>
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
          {tools.map((tool) => (
            <li key={tool.id}>
              <ToolCard tool={tool} />
            </li>
          ))}
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
