import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { USER_ROLE, USER_STATUS } from "@/lib/labels";
import { formatDateHe } from "@/lib/utils";
import { UserActions } from "./UserActions";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "PENDING", label: "ממתינים" },
  { key: "APPROVED", label: "מאושרים" },
  { key: "BANNED", label: "חסומים" },
  { key: "SUSPENDED", label: "מושעים" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/users");
  if (session.user.role !== "ADMIN") redirect("/");

  const tab = (TABS.find((t) => t.key === searchParams.tab)?.key ??
    "PENDING") as TabKey;

  const where =
    tab === "BANNED"
      ? { isBanned: true, deletedAt: null }
      : { status: tab, deletedAt: null };

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      status: true,
      isBanned: true,
      banReason: true,
      createdAt: true,
    },
  });

  // Counts for badges
  const [pending, approved, banned, suspended] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING", deletedAt: null } }),
    prisma.user.count({ where: { status: "APPROVED", deletedAt: null } }),
    prisma.user.count({ where: { isBanned: true, deletedAt: null } }),
    prisma.user.count({ where: { status: "SUSPENDED", deletedAt: null } }),
  ]);
  const counts: Record<TabKey, number> = {
    PENDING: pending,
    APPROVED: approved,
    BANNED: banned,
    SUSPENDED: suspended,
  };

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">ניהול משתמשים</h1>
      </header>

      <nav
        className="flex gap-2 overflow-x-auto scrollbar-thin -mx-4 px-4"
        aria-label="סינון לפי סטטוס"
      >
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <a
              key={t.key}
              href={`?tab=${t.key}`}
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
                {counts[t.key]}
              </span>
            </a>
          );
        })}
      </nav>

      {users.length === 0 ? (
        <p className="text-center text-text-muted py-8">אין משתמשים בקטגוריה זו.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {users.map((u) => (
            <li
              key={u.id}
              className="bg-bg-surface rounded-2xl border border-primary-100 p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{u.name}</div>
                  <div className="text-xs text-text-muted" dir="ltr">
                    {u.phone} · {u.email}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end shrink-0">
                  <Badge variant="primary">{USER_ROLE[u.role]}</Badge>
                  <Badge
                    variant={
                      u.isBanned
                        ? "error"
                        : u.status === "APPROVED"
                          ? "success"
                          : u.status === "PENDING"
                            ? "warning"
                            : "error"
                    }
                  >
                    {u.isBanned ? "חסום" : USER_STATUS[u.status]}
                  </Badge>
                </div>
              </div>

              <div className="text-xs text-text-muted">
                נרשם ב-{formatDateHe(u.createdAt)}
              </div>

              {u.isBanned && u.banReason && (
                <div className="text-xs bg-red-50 text-red-700 rounded-lg px-2 py-1">
                  סיבת חסימה: {u.banReason}
                </div>
              )}

              <UserActions
                userId={u.id}
                status={u.status}
                isBanned={u.isBanned}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
