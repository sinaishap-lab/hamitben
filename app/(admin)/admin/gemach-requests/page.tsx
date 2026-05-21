import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { formatDateHe } from "@/lib/utils";
import { GemachRequestActions } from "./GemachRequestActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "ממתינה",
  CONTACTED: "ביצעו קשר",
  OPENED: "נפתח גמח",
  REJECTED: "נדחתה",
};

const STATUS_VARIANT = {
  PENDING: "warning",
  CONTACTED: "primary",
  OPENED: "success",
  REJECTED: "error",
} as const;

export default async function AdminGemachRequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/gemach-requests");
  if (session.user.role !== "ADMIN") redirect("/");

  const requests = await prisma.gemachRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">בקשות פתיחת גמח</h1>
        <p className="text-sm text-text-muted">{requests.length} בקשות</p>
      </header>

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
                <div className="min-w-0">
                  <div className="font-bold">{r.name}</div>
                  <a
                    href={`tel:${r.phone}`}
                    dir="ltr"
                    className="text-xs text-primary"
                  >
                    {r.phone}
                  </a>
                </div>
                <Badge variant={STATUS_VARIANT[r.status]}>
                  {STATUS_LABEL[r.status]}
                </Badge>
              </div>
              <div className="text-xs text-text-muted">
                {formatDateHe(r.createdAt)}
              </div>
              {r.notes && (
                <div className="text-xs bg-primary-50 rounded-lg px-2 py-1">
                  {r.notes}
                </div>
              )}
              <GemachRequestActions id={r.id} status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
