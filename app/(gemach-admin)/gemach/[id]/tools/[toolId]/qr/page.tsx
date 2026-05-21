import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

// Spec §20.3 – print-friendly QR sticker
export default async function ToolQrPage({
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
      gemach: { select: { id: true, name: true, managerId: true } },
    },
  });
  if (!tool) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = tool.gemach.managerId === session.user.id;
  if (!isAdmin && !isOwner) redirect("/");

  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <header className="print:hidden">
        <h1 className="text-2xl font-bold text-primary">מדבקת QR להדפסה</h1>
        <p className="text-sm text-text-muted">{tool.gemach.name} · {tool.name}</p>
      </header>

      <PrintButton />

      {/* Sticker – sized for a 6×8 cm label */}
      <div className="mx-auto bg-white border-2 border-primary rounded-2xl p-4 w-[6cm] flex flex-col items-center gap-2 text-center print:border-black print:rounded-none print:my-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/tools/${tool.id}/qr`}
          alt={`קוד QR לכלי ${tool.name}`}
          width={200}
          height={200}
          className="w-[5cm] h-[5cm]"
        />
        <div className="text-xs font-bold text-primary print:text-black mt-1">
          🌾 המתבן
        </div>
        <div className="text-sm font-bold leading-tight text-black break-words w-full">
          {tool.name}
        </div>
        <div className="text-[10px] text-text-muted print:text-black">
          סרוק להשאלה
        </div>
      </div>

      <p className="text-xs text-text-muted text-center print:hidden">
        ממד מומלץ: 6×8 ס&quot;מ · מדבקה לאמינה (waterproof) · הדפסה בצבע
      </p>
    </div>
  );
}
