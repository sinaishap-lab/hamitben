import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryManager } from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/categories");
  if (session.user.role !== "ADMIN") redirect("/");

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      icon: true,
      sortOrder: true,
      _count: { select: { tools: true } },
    },
  });

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">קטגוריות כלים</h1>
        <p className="text-sm text-text-muted mt-1">
          הוספה, עריכה ומחיקה של הקטגוריות שכלים משויכים אליהן בקטלוג
        </p>
      </header>

      <CategoryManager
        initial={categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          sortOrder: c.sortOrder,
          toolCount: c._count.tools,
        }))}
      />
    </div>
  );
}
