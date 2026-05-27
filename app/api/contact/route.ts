import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { notifyAdmins } from "@/lib/notifications";

// POST /api/contact — spec §8.9. Doesn't persist (yet) — only notifies admins.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Re-use TOOL_DONATION_REQUEST template structure for now — explicit copy
  // tailored for contact lives in a brief inline build.
  const { name, phone, subject, message } = parsed.data;

  try {
    // Lazy import to avoid pulling unrelated channel SDKs into other routes
    const { sendEmail } = await import("@/lib/notifications/email");
    const { sendWhatsApp } = await import("@/lib/notifications/whatsapp");
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPhone = process.env.ADMIN_PHONE;

    const msgBody =
      `📩 *פנייה חדשה ב'צור קשר'*\n\n` +
      `שם: ${name}\nטלפון: ${phone}\nנושא: ${subject}\n\n${message}`;

    if (adminEmail) {
      await sendEmail(adminEmail, `[המתבן] ${subject}`, msgBody);
    }
    if (adminPhone) {
      await sendWhatsApp(adminPhone, msgBody);
    }
    if (!adminEmail && !adminPhone) {
      // Fallback: notify all admins via standard fan-out
      await notifyAdmins("TOOL_REQUEST_CREATED", {
        description: `${subject}\n${message}`,
        userName: name,
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[contact.POST] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
