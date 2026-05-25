import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserEditForm } from "./UserEditForm";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/admin/users/${params.id}/edit`);
  if (session.user.role !== "ADMIN") redirect("/");

  const [user, gemachs] = await Promise.all([
    prisma.user.findFirst({
      where: { id: params.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        isBanned: true,
        banReason: true,
        managedGemach: { select: { id: true, name: true } },
      },
    }),
    prisma.gemach.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        manager: { select: { id: true, name: true } },
      },
    }),
  ]);
  if (!user) notFound();

  const isSelf = session.user.id === user.id;

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header className="flex items-center gap-2">
        <Link
          href="/admin/users"
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary-50 transition-colors text-primary"
          aria-label="חזרה לרשימת המשתמשים"
        >
          <ArrowRight className="w-5 h-5" aria-hidden />
        </Link>
        <h1 className="text-2xl font-bold text-primary">עריכת משתמש</h1>
      </header>

      <UserEditForm
        userId={user.id}
        isSelf={isSelf}
        initial={{
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          isBanned: user.isBanned,
          banReason: user.banReason ?? "",
        }}
        currentGemach={user.managedGemach}
        gemachs={gemachs.map((g) => ({
          id: g.id,
          name: g.name,
          managerName: g.manager.name,
        }))}
      />
    </div>
  );
}
