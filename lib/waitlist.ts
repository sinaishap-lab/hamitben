import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

/**
 * When a tool becomes free again (e.g. RETURNED loan), notify the next person
 * in line that the tool is now available. Marks `notifiedAt` so we don't
 * spam them on subsequent return events.
 */
export async function notifyNextInWaitlist(
  toolId: string,
  toolName?: string
): Promise<string | null> {
  const next = await prisma.waitlist.findFirst({
    where: { toolId, notifiedAt: null },
    orderBy: { position: "asc" },
    select: { id: true, userId: true },
  });
  if (!next) return null;

  await prisma.waitlist.update({
    where: { id: next.id },
    data: { notifiedAt: new Date() },
  });

  await notifyUser(next.userId, "WAITLIST_TURN", {
    toolId,
    toolName: toolName ?? "הכלי",
  });
  return next.userId;
}
