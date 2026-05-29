import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { LoanStatus, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Alert } from "@/components/ui/Alert";
import { LoanStatusBadge } from "@/components/loans/LoanStatusBadge";
import { CancelLoanButton } from "./CancelLoanButton";
import { formatDateHe, formatShekel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS: { key: string; label: string; statuses: LoanStatus[] }[] = [
  { key: "ACTIVE", label: "פעילות", statuses: ["APPROVED", "ACTIVE"] },
  { key: "PENDING", label: "ממתינות", statuses: ["PENDING"] },
  {
    key: "HISTORY",
    label: "היסטוריה",
    statuses: ["RETURNED", "OVERDUE", "REJECTED", "CANCELLED"],
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function MyLoansPage({
  searchParams,
}: {
  searchParams: { tab?: string; "just-requested"?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/my-loans");

  const tabKey = TABS.find((t) => t.key === searchParams.tab)?.key ?? "ACTIVE";
  const tab = TABS.find((t) => t.key === tabKey)!;

  const where: Prisma.LoanWhereInput = {
    userId: session.user.id,
    status: { in: tab.statuses },
  };

  const loans = await prisma.loan.findMany({
    where,
    orderBy: [{ startDate: "desc" }],
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      actualReturnDate: true,
      depositAmount: true,
      dailyRate: true,
      totalCharged: true,
      adminNotes: true,
      tool: {
        select: {
          id: true,
          name: true,
          images: true,
          gemach: { select: { name: true } },
        },
      },
    },
  });

  const counts: Record<string, number> = {};
  await Promise.all(
    TABS.map(async (t) => {
      counts[t.key] = await prisma.loan.count({
        where: { userId: session.user.id, status: { in: t.statuses } },
      });
    })
  );

  const justRequested = searchParams["just-requested"] === "1";
  const now = Date.now();

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">ההשאלות שלי</h1>
      </header>

      {justRequested && (
        <Alert variant="success">
          הבקשה נשלחה. נעדכן אותך ברגע שמנהל הגמח יחזיר תשובה.
        </Alert>
      )}

      <nav
        className="-mx-4 px-4 flex gap-2 overflow-x-auto scrollbar-thin"
        aria-label="סינון לפי סטטוס"
      >
        {TABS.map((t) => {
          const active = t.key === tabKey;
          return (
            <Link
              key={t.key}
              href={`/my-loans?tab=${t.key}`}
              className={`shrink-0 px-3 h-9 inline-flex items-center gap-2 rounded-full border text-sm ${
                active
                  ? "bg-primary text-text-inverse border-primary"
                  : "bg-bg-surface text-text border-primary-100"
              }`}
            >
              {t.label}
              <span
                className={`text-xs rounded-full px-1.5 ${
                  active ? "bg-white/20" : "bg-primary-50 text-text-muted"
                }`}
              >
                {counts[t.key] ?? 0}
              </span>
            </Link>
          );
        })}
      </nav>

      {loans.length === 0 ? (
        <div className="text-center py-6 flex flex-col items-center gap-3">
          <p className="text-text-muted">אין השאלות בקטגוריה זו.</p>
          <Link
            href="/catalog"
            className="text-primary font-medium underline"
          >
            עבור לקטלוג
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {loans.map((l) => {
            const daysLeft =
              l.status === "ACTIVE"
                ? Math.ceil((l.endDate.getTime() - now) / DAY_MS)
                : null;
            return (
              <li
                key={l.id}
                className="bg-bg-surface rounded-2xl border border-primary-100 p-3 flex flex-col gap-2"
              >
                <div className="flex gap-3">
                  <Link
                    href={`/catalog/${l.tool.id}`}
                    className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-bg border border-primary-50"
                  >
                    {l.tool.images[0] && (
                      <Image
                        src={l.tool.images[0]}
                        alt={l.tool.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/catalog/${l.tool.id}`}
                          className="font-bold truncate block"
                        >
                          {l.tool.name}
                        </Link>
                        <div className="text-xs text-text-muted">
                          {l.tool.gemach.name}
                        </div>
                      </div>
                      <LoanStatusBadge status={l.status} />
                    </div>

                    <div className="text-xs text-text-muted mt-1">
                      {formatDateHe(l.startDate)} — {formatDateHe(l.endDate)}
                    </div>

                    {daysLeft !== null && (
                      <div
                        className={`text-xs mt-1 font-medium ${
                          daysLeft < 1
                            ? "text-error"
                            : daysLeft <= 1
                              ? "text-warning"
                              : "text-text-muted"
                        }`}
                      >
                        {daysLeft < 0
                          ? `איחור ${Math.abs(daysLeft)} ימים`
                          : daysLeft === 0
                            ? "החזרה היום"
                            : daysLeft === 1
                              ? "החזרה מחר"
                              : `${daysLeft} ימים להחזרה`}
                      </div>
                    )}

                    {l.totalCharged != null && (
                      <div className="text-xs text-text-muted">
                        חויב {formatShekel(l.totalCharged)}
                      </div>
                    )}

                    {l.adminNotes && (
                      <div className="text-xs bg-red-50 text-red-700 rounded-lg px-2 py-1 mt-1">
                        {l.adminNotes}
                      </div>
                    )}
                  </div>
                </div>

                {l.status === "PENDING" && <CancelLoanButton loanId={l.id} />}
              </li>
            );
          })}
        </ul>
      )}

      {/* Illustration — lazy loaded, below the loans list. */}
      <Image
        src="/hahashalot.png"
        alt=""
        aria-hidden
        width={320}
        height={320}
        className="w-full max-w-xs h-auto mx-auto mix-blend-multiply mt-2"
      />
    </div>
  );
}
