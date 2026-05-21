import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;
  if (pub && priv && email) {
    webpush.setVapidDetails(`mailto:${email}`, pub, priv);
    configured = true;
  } else {
    configured = false;
  }
  return configured;
}

export async function sendPush(
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<{ ok: boolean; sent: number }> {
  if (!ensureConfigured()) {
    console.log(`[notify.push:stub] → ${userId}`, payload);
    return { ok: true, sent: 0 };
  }

  const tokens = await prisma.pushToken.findMany({
    where: { userId },
    select: { id: true, token: true },
  });
  if (tokens.length === 0) return { ok: true, sent: 0 };

  const json = JSON.stringify(payload);
  const dead: string[] = [];
  let sent = 0;

  await Promise.all(
    tokens.map(async (t) => {
      try {
        const sub = JSON.parse(t.token);
        await webpush.sendNotification(sub, json);
        sent++;
      } catch (err) {
        const e = err as { statusCode?: number };
        if (e.statusCode === 410 || e.statusCode === 404) {
          dead.push(t.id);
        } else {
          console.error("[notify.push] send failed", err);
        }
      }
    })
  );

  if (dead.length > 0) {
    await prisma.pushToken.deleteMany({ where: { id: { in: dead } } });
  }
  return { ok: true, sent };
}
