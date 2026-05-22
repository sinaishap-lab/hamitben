import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ToolForm } from "@/components/tools/ToolForm";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export default async function NewToolPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const gemach = await prisma.gemach.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, managerId: true },
  });
  if (!gemach) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = gemach.managerId === session.user.id;
  if (!isAdmin && !isOwner) redirect("/");

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">כלי חדש</h1>
        <p className="text-sm text-text-muted">{gemach.name}</p>
      </header>

      <ToolForm
        gemachId={gemach.id}
        initial={{
          name: "",
          description: "",
          category: "HAND_TOOLS",
          images: [],
          autoApprove: false,
          depositAmount: 0,
          dailyRate: 0,
          maxDays: 7,
        }}
        redirectAfter={`/gemach/${gemach.id}/tools`}
        cloudinaryConfigured={isCloudinaryConfigured()}
      />
    </div>
  );
}
