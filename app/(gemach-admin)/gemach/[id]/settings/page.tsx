import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GemachEditForm } from "@/components/gemach/GemachEditForm";

export const dynamic = "force-dynamic";

export default async function GemachSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const gemach = await prisma.gemach.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      description: true,
      address: true,
      phone: true,
      lat: true,
      lng: true,
      imageUrl: true,
      managerId: true,
    },
  });
  if (!gemach) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = gemach.managerId === session.user.id;
  if (!isAdmin && !isOwner) redirect("/");

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-primary">הגדרות גמח</h1>
        <p className="text-sm text-text-muted mt-1">{gemach.name}</p>
      </header>

      <GemachEditForm
        gemachId={gemach.id}
        initial={{
          name: gemach.name,
          description: gemach.description,
          address: gemach.address,
          phone: gemach.phone,
          lat: gemach.lat,
          lng: gemach.lng,
          imageUrl: gemach.imageUrl,
        }}
        redirectAfter={`/gemach/${gemach.id}/dashboard`}
      />
    </div>
  );
}
