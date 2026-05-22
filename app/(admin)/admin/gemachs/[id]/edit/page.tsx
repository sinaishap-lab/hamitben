import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GemachEditForm } from "@/components/gemach/GemachEditForm";

export const dynamic = "force-dynamic";

export default async function AdminEditGemachPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const gemach = await prisma.gemach.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      phone: true,
      manager: { select: { name: true, phone: true } },
    },
  });
  if (!gemach) notFound();

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">עריכת גמח</h1>
        <p className="text-sm text-text-muted mt-1">
          מנהל: {gemach.manager.name} ({gemach.manager.phone})
        </p>
      </header>

      <GemachEditForm
        gemachId={gemach.id}
        initial={{
          name: gemach.name,
          description: gemach.description,
          address: gemach.address,
          phone: gemach.phone,
        }}
        redirectAfter="/admin/gemachs"
      />
    </div>
  );
}
