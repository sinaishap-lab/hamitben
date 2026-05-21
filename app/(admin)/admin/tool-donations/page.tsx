import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { formatDateHe } from "@/lib/utils";
import { ToolDonationActions } from "./ToolDonationActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "ממתינה",
  CONTACTED: "ביצעו קשר",
  ACCEPTED: "התקבלה",
  DECLINED: "נדחתה",
};

const STATUS_VARIANT = {
  PENDING: "warning",
  CONTACTED: "primary",
  ACCEPTED: "success",
  DECLINED: "error",
} as const;

export default async function AdminToolDonationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/tool-donations");
  if (session.user.role !== "ADMIN") redirect("/");

  const requests = await prisma.toolDonationRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">הצעות תרומת כלים</h1>
        <p className="text-sm text-text-muted">{requests.length} הצעות</p>
      </header>

      {requests.length === 0 ? (
        <p className="text-center text-text-muted py-8">אין הצעות.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => (
            <li
              key={r.id}
              className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold">{r.donorName}</div>
                  <a
                    href={`tel:${r.donorPhone}`}
                    dir="ltr"
                    className="text-xs text-primary"
                  >
                    {r.donorPhone}
                  </a>
                </div>
                <Badge variant={STATUS_VARIANT[r.status]}>
                  {STATUS_LABEL[r.status]}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed">{r.toolDesc}</p>
              <div className="text-xs text-text-muted">
                {formatDateHe(r.createdAt)}
              </div>
              {r.notes && (
                <div className="text-xs bg-primary-50 rounded-lg px-2 py-1">
                  {r.notes}
                </div>
              )}
              <ToolDonationActions id={r.id} status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
