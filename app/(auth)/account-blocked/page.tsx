import Link from "next/link";
import { Alert } from "@/components/ui/Alert";

const MESSAGES: Record<string, { title: string; body: string }> = {
  REJECTED: {
    title: "בקשת ההרשמה נדחתה",
    body: "מנהל המערכת לא אישר את ההרשמה שלך. ניתן לפנות לבירור.",
  },
  SUSPENDED: {
    title: "החשבון מושעה",
    body: "החשבון שלך הושעה זמנית. אנא צור קשר עם מנהל המערכת.",
  },
  BANNED: {
    title: "החשבון חסום מהשאלות",
    body: "בעקבות החזרת כלי באיחור החשבון חסום מהשאלות עתידיות. ניתן לפנות למנהל ראשי להסרת החסימה.",
  },
};

export default function AccountBlockedPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status?.toUpperCase() || "SUSPENDED";
  const msg = MESSAGES[status] ?? MESSAGES.SUSPENDED;

  return (
    <div className="px-4 py-8 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-error">{msg.title}</h1>
      <Alert variant="error">{msg.body}</Alert>
      <Link
        href="/contact"
        className="text-primary text-center font-medium underline"
      >
        צור קשר עם המנהל
      </Link>
    </div>
  );
}
