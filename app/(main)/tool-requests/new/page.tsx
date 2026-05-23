import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewToolRequestForm } from "./NewToolRequestForm";

export const dynamic = "force-dynamic";

export default async function NewToolRequestPage() {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/tool-requests/new`);
  }

  const [gemachs, categories] = await Promise.all([
    prisma.gemach.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">בקש כלי חסר</h1>
        <p className="text-sm text-text-muted mt-1">
          לא מצאת בקטלוג? תאר את הכלי שאתה צריך, ונודיע לך כשיתווסף.
        </p>
      </header>
      <NewToolRequestForm gemachs={gemachs} categories={categories} />
    </div>
  );
}
