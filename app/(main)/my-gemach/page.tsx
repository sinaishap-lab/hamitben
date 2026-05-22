import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Convenience redirect — a gemach manager always knows where their dashboard
// is via the TopBar shortcut, but doesn't have to remember the gemach id.
export const dynamic = "force-dynamic";

export default async function MyGemachRedirect() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/my-gemach");
  if (session.user.role === "ADMIN") redirect("/admin/gemachs");
  if (session.user.role !== "GEMACH_MANAGER") redirect("/");

  const gemach = await prisma.gemach.findUnique({
    where: { managerId: session.user.id },
    select: { id: true },
  });
  if (!gemach) redirect("/");
  redirect(`/gemach/${gemach.id}/dashboard`);
}
