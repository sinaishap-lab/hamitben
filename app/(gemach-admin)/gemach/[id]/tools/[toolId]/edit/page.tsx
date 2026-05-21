import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ToolForm } from "@/components/tools/ToolForm";
import { DeleteToolButton } from "./DeleteToolButton";

export const dynamic = "force-dynamic";

export default async function EditToolPage({
  params,
}: {
  params: { id: string; toolId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tool = await prisma.tool.findFirst({
    where: { id: params.toolId, gemachId: params.id, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      images: true,
      autoApprove: true,
      depositAmount: true,
      dailyRate: true,
      maxDays: true,
      gemach: { select: { id: true, name: true, managerId: true } },
    },
  });
  if (!tool) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = tool.gemach.managerId === session.user.id;
  if (!isAdmin && !isOwner) redirect("/");

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">עריכת כלי</h1>
        <p className="text-sm text-text-muted">{tool.gemach.name}</p>
      </header>

      <ToolForm
        gemachId={tool.gemach.id}
        toolId={tool.id}
        initial={{
          name: tool.name,
          description: tool.description ?? "",
          category: tool.category,
          images: tool.images,
          autoApprove: tool.autoApprove,
          depositAmount: tool.depositAmount,
          dailyRate: tool.dailyRate,
          maxDays: tool.maxDays,
        }}
        redirectAfter={`/gemach/${tool.gemach.id}/tools`}
      />

      <section className="bg-bg-surface rounded-2xl border border-red-100 p-4 mt-4">
        <h2 className="font-bold text-error mb-1">הסר כלי</h2>
        <p className="text-xs text-text-muted mb-3">
          הסרת הכלי תסיר אותו מהקטלוג, אך היסטוריית ההשאלות תישמר.
        </p>
        <DeleteToolButton
          toolId={tool.id}
          redirectAfter={`/gemach/${tool.gemach.id}/tools`}
        />
      </section>
    </div>
  );
}
