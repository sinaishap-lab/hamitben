import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ToolCard } from "@/components/tools/ToolCard";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/favorites");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id, tool: { isActive: true } },
    orderBy: { createdAt: "desc" },
    select: {
      tool: {
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
    },
  });

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary text-center">
          המועדפים שלי
        </h1>
      </header>

      {favorites.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary-200" aria-hidden />
          </div>
          <p className="text-text-muted max-w-xs">
            עדיין לא סימנת כלים. סמן כלי בלב ❤️ כדי לשמור אותו כאן ולקבל עדכון
            כשהוא מתפנה.
          </p>
          <Link href="/catalog" className="text-primary font-medium underline">
            עבור לקטלוג
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {favorites.map((f) => (
            <li key={f.tool.id}>
              <ToolCard tool={f.tool} favorite />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
