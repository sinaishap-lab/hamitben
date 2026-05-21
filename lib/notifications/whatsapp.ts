import twilio, { type Twilio } from "twilio";

let client: Twilio | null = null;
let configured: boolean | null = null;

function isConfigured(): boolean {
  if (configured !== null) return configured;
  configured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_NUMBER
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

function toWhatsApp(phone: string): string {
  // Twilio expects: whatsapp:+972...
  let p = phone.replace(/[\s-]/g, "");
  if (p.startsWith("0")) p = "+972" + p.slice(1);
  else if (!p.startsWith("+")) p = "+" + p;
  return `whatsapp:${p}`;
}

export async function sendWhatsApp(
  toPhone: string,
  message: string
): Promise<{ ok: boolean; reason?: string }> {
  if (!isConfigured()) {
    console.log(
      `[notify.whatsapp:stub] → ${toPhone}\n${message}\n———`
    );
    return { ok: true, reason: "stub" };
  }
  try {
    await getClient().messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: toWhatsApp(toPhone),
      body: message,
    });
    return { ok: true };
  } catch (err) {
    console.error("[notify.whatsapp] failed", err);
    return { ok: false, reason: (err as Error).message };
  }
}
