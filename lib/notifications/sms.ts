import twilio, { type Twilio } from "twilio";

let client: Twilio | null = null;
let configured: boolean | null = null;

function isConfigured(): boolean {
  if (configured !== null) return configured;
  configured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_SMS_NUMBER
  );
  return configured;
}

function getClient(): Twilio {
  if (!client) {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
  return client;
}

function toE164(phone: string): string {
  let p = phone.replace(/[\s-]/g, "");
  if (p.startsWith("0")) p = "+972" + p.slice(1);
  else if (!p.startsWith("+")) p = "+" + p;
  return p;
}

export async function sendSMS(
  toPhone: string,
  message: string
): Promise<{ ok: boolean; reason?: string }> {
  if (!isConfigured()) {
    console.log(`[notify.sms:stub] → ${toPhone}\n${message}\n———`);
    return { ok: true, reason: "stub" };
  }
  try {
    await getClient().messages.create({
      from: process.env.TWILIO_SMS_NUMBER!,
      to: toE164(toPhone),
      body: message,
    });
    return { ok: true };
  } catch (err) {
    console.error("[notify.sms] failed", err);
    return { ok: false, reason: (err as Error).message };
  }
}
