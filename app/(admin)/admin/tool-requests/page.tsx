import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { TOOL_CATEGORY } from "@/lib/labels";
import { formatDateHe } from "@/lib/utils";
import { ToolRequestActions } from "./ToolRequestActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "ממתינה",
  NOTED: "נרשמה",
  FULFILLED: "מולאה",
};

const STATUS_VARIANT = {
  PENDING: "warning",
  NOTED: "primary",
  FULFILLED: "success",
} as const;

export default async function AdminToolRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/tool-requests");
  if (session.user.role !== "ADMIN") redirect("/");

  const requests = await prisma.toolRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      description: true,
      category: true,
      status: true,
      createdAt: true,
      user: { select: { name: true, phone: true } },
      gemach: { select: { name: true } },
    },
  });

  // Group by category to surface "in-demand" tools (spec §20.4)
  const categoryCounts = new Map<string, number>();
  for (const r of requests) {
    if (r.status === "PENDING" && r.category) {
      categoryCounts.set(r.category, (categoryCounts.get(r.category) ?? 0) + 1);
    }
  }
  const hotCategories = Array.from(categoryCounts.entries()).filter(
    ([, c]) => c >= 3
  );

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">בקשות כלים חסרים</h1>
        <p className="text-sm text-text-muted">
          {requests.length} בקשות במערכת
        </p>
      </header>

      {hotCategories.length > 0 && (
        <div className="bg-accent/15 border border-accent rounded-2xl p-3 text-sm">
          <div className="font-bold mb-1">🔥 קטגוריות מבוקשות</div>
          <ul className="flex flex-wrap gap-2">
            {hotCategories.map(([cat, c]) => (
              <li
                key={cat}
                className="bg-bg-surface rounded-full px-2 py-0.5 text-xs"
              >
                {TOOL_CATEGORY[cat as keyof typeof TOOL_CATEGORY]} · {c} בקשות
              </li>
            ))}
          </ul>
        </div>
      )}

      {requests.length === 0 ? (
        <p className="text-center text-text-muted py-8">אין בקשות.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => (
            <li
              key={r.id}
              className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-relaxed">{r.description}</p>
                <Badge variant={STATUS_VARIANT[r.status]}>
                  {STATUS_LABEL[r.status]}
                </Badge>
              </div>
              <div className="text-xs text-text-muted">
                {r.user.name} · <span dir="ltr">{r.user.phone}</span>
                {r.category && (
                  <>
                    {" · "}
                    {TOOL_CATEGORY[r.category]}
                  </>
                )}
                {r.gemach && <> · יעד: {r.gemach.name}</>}
                {" · "}
                {formatDateHe(r.createdAt)}
              </div>
              <ToolRequestActions id={r.id} status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
