import { Resend } from "resend";

let client: Resend | null = null;

function isConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function getClient(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY!);
  return client;
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ ok: boolean; reason?: string }> {
  if (!isConfigured()) {
    console.log(
      `[notify.email:stub] → ${to}\nSubject: ${subject}\n\n${body}\n———`
    );
    return { ok: true, reason: "stub" };
  }
  try {
    await getClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject,
      // Wrap plain text in an RTL HTML container so Hebrew renders right
      html: `<div dir="rtl" style="font-family:Heebo,system-ui,sans-serif;font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(body)}</div>`,
      text: body,
    });
    return { ok: true };
  } catch (err) {
    console.error("[notify.email] failed", err);
    return { ok: false, reason: (err as Error).message };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
