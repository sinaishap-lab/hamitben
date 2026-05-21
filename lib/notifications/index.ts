import { prisma } from "@/lib/prisma";
import { sendWhatsApp } from "./whatsapp";
import { sendSMS } from "./sms";
import { sendEmail } from "./email";
import { sendPush } from "./push";
import { renderMessage } from "./templates";
import type { NotificationData, NotificationEvent, Recipient } from "./types";

export type { NotificationEvent } from "./types";

type NotifyOptions = {
  /** Channels to skip. Default = none. */
  skip?: Array<"whatsapp" | "sms" | "email" | "push">;
};

/**
 * Fan-out one event to all four channels for one user. Failures on any
 * channel are logged but never throw — callers can safely fire-and-forget.
 *
 * Returns a per-channel summary, useful for tests/admin tooling.
 */
export async function notifyUser(
  userId: string,
  event: NotificationEvent,
  data: NotificationData = {},
  opts: NotifyOptions = {}
) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, name: true, phone: true, email: true },
  });
  if (!user) {
    console.warn(`[notify] user ${userId} not found – skipping ${event}`);
    return null;
  }
  return notifyRecipient(user as Recipient, event, data, opts);
}

/**
 * Variant for senders who already have a Recipient snapshot (admin email,
 * not-yet-registered recipients, etc.).
 */
export async function notifyRecipient(
  recipient: Recipient,
  event: NotificationEvent,
  data: NotificationData = {},
  opts: NotifyOptions = {}
) {
  const skip = new Set(opts.skip ?? []);
  const msg = renderMessage(event, { ...data, recipientName: recipient.name });

  const channels: Promise<unknown>[] = [];
  if (!skip.has("whatsapp")) channels.push(sendWhatsApp(recipient.phone, msg.whatsapp));
  if (!skip.has("sms")) channels.push(sendSMS(recipient.phone, msg.sms));
  if (!skip.has("email") && recipient.email)
    channels.push(sendEmail(recipient.email, msg.email.subject, msg.email.body));
  if (!skip.has("push")) channels.push(sendPush(recipient.id, msg.push));

  const results = await Promise.allSettled(channels);
  return { event, recipientId: recipient.id, results };
}

/**
 * Notify all root admins (used for system-wide events like "new signup",
 * "missing-tool request"). Does not require a registered user id.
 */
export async function notifyAdmins(
  event: NotificationEvent,
  data: NotificationData = {}
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", deletedAt: null },
    select: { id: true, name: true, phone: true, email: true },
  });
  await Promise.allSettled(
    admins.map((a) => notifyRecipient(a as Recipient, event, data))
  );
}
