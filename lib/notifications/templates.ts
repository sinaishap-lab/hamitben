import type {
  NotificationData,
  NotificationEvent,
  RenderedMessage,
} from "./types";

const APP_URL = process.env.NEXTAUTH_URL || "https://hamitben.co.il";
const BRAND = "🌾 *המתבן*";
const BRAND_PLAIN = "המתבן";

function fallback(d: NotificationData, key: string, def = ""): string {
  const v = d[key];
  return v == null ? def : String(v);
}

/**
 * Build per-channel copy for a notification event.
 *
 * WhatsApp uses Markdown (asterisks for bold). SMS and Push titles stay short.
 * Email gets a subject + a slightly longer body.
 */
export function renderMessage(
  event: NotificationEvent,
  data: NotificationData
): RenderedMessage {
  switch (event) {
    case "USER_REGISTERED": {
      const name = fallback(data, "name", "משתמש חדש");
      const phone = fallback(data, "phone");
      return {
        whatsapp: `${BRAND}\n📬 *רישום חדש ממתין לאישור*\n\n${name}\n${phone}\n\nאישור: ${APP_URL}/admin/users`,
        sms: `${BRAND_PLAIN}: רישום חדש (${name}) ממתין לאישור.`,
        email: {
          subject: "רישום חדש ממתין לאישור – המתבן",
          body: `נרשם משתמש חדש למערכת:\n\nשם: ${name}\nטלפון: ${phone}\n\nאישור: ${APP_URL}/admin/users`,
        },
        push: {
          title: "רישום חדש",
          body: `${name} ממתין לאישור`,
          url: "/admin/users",
        },
      };
    }

    case "USER_APPROVED":
      return {
        whatsapp: `${BRAND}\n✅ *חשבונך אושר!*\n\nעכשיו ניתן לבקש השאלת כלים. בהצלחה.\n${APP_URL}/catalog`,
        sms: `${BRAND_PLAIN}: חשבונך אושר. ניתן לבקש השאלות.`,
        email: {
          subject: "חשבונך אושר – המתבן",
          body: `שלום,\n\nחשבונך במתבן אושר. מעכשיו ניתן לבקש השאלות מהקטלוג.\n\n${APP_URL}/catalog`,
        },
        push: {
          title: "חשבונך אושר",
          body: "ניתן לבקש השאלות מהקטלוג",
          url: "/catalog",
        },
      };

    case "LOAN_REQUESTED": {
      const tool = fallback(data, "toolName", "כלי");
      const userName = fallback(data, "userName");
      const startDate = fallback(data, "startDate");
      const endDate = fallback(data, "endDate");
      return {
        whatsapp: `${BRAND}\n📋 *בקשת השאלה חדשה*\n\n${tool}\nמבקש: ${userName}\nתאריכים: ${startDate} – ${endDate}\n\nאישור: ${APP_URL}/gemach/${fallback(data, "gemachId")}/loans?tab=PENDING`,
        sms: `${BRAND_PLAIN}: בקשת השאלה חדשה ל-${tool} מ-${userName}.`,
        email: {
          subject: `בקשת השאלה חדשה – ${tool}`,
          body: `התקבלה בקשת השאלה חדשה:\n\nכלי: ${tool}\nמבקש: ${userName}\nתאריכים: ${startDate} – ${endDate}\n\nניהול: ${APP_URL}/gemach/${fallback(data, "gemachId")}/loans?tab=PENDING`,
        },
        push: {
          title: "בקשת השאלה חדשה",
          body: `${tool} – ${userName}`,
          url: `/gemach/${fallback(data, "gemachId")}/loans?tab=PENDING`,
        },
      };
    }

    case "LOAN_APPROVED": {
      const tool = fallback(data, "toolName", "הכלי");
      const startDate = fallback(data, "startDate");
      const gemach = fallback(data, "gemachName");
      return {
        whatsapp: `${BRAND}\n✅ *בקשת ההשאלה אושרה!*\n\n${tool} – ${gemach}\nניתן לאסוף מהגמח החל מ-${startDate}.\n\nפרטים: ${APP_URL}/my-loans`,
        sms: `${BRAND_PLAIN}: ההשאלה של ${tool} אושרה. איסוף מ-${startDate}.`,
        email: {
          subject: `ההשאלה אושרה – ${tool}`,
          body: `בקשתך ל${tool} ב${gemach} אושרה.\n\nניתן לאסוף מהגמח החל מ-${startDate}.\n\n${APP_URL}/my-loans`,
        },
        push: {
          title: "ההשאלה אושרה",
          body: `${tool} – איסוף מ-${startDate}`,
          url: "/my-loans",
        },
      };
    }

    case "LOAN_REJECTED": {
      const tool = fallback(data, "toolName", "הכלי");
      const reason = fallback(data, "reason");
      return {
        whatsapp: `${BRAND}\n❌ *בקשת ההשאלה נדחתה*\n\n${tool}${reason ? `\nסיבה: ${reason}` : ""}\n\nלפרטים: ${APP_URL}/my-loans`,
        sms: `${BRAND_PLAIN}: ההשאלה של ${tool} נדחתה.${reason ? " " + reason : ""}`,
        email: {
          subject: `ההשאלה נדחתה – ${tool}`,
          body: `בקשתך ל${tool} נדחתה.${reason ? `\n\nסיבה: ${reason}` : ""}\n\n${APP_URL}/my-loans`,
        },
        push: { title: "ההשאלה נדחתה", body: tool, url: "/my-loans" },
      };
    }

    case "LOAN_COLLECTED": {
      const tool = fallback(data, "toolName", "הכלי");
      const endDate = fallback(data, "endDate");
      return {
        whatsapp: `${BRAND}\n📦 *הכלי נאסף*\n\n${tool}\nהחזרה עד: ${endDate}\n\nתודה שלקחת חלק!`,
        sms: `${BRAND_PLAIN}: ${tool} נאסף. החזרה עד ${endDate}.`,
        email: {
          subject: `הכלי נאסף – ${tool}`,
          body: `סימנו שאספת את ${tool}. החזרה עד ${endDate}.\n\nבהצלחה!`,
        },
        push: {
          title: "הכלי נאסף",
          body: `${tool} – החזרה עד ${endDate}`,
          url: "/my-loans",
        },
      };
    }

    case "LOAN_RETURN_REMINDER": {
      const tool = fallback(data, "toolName", "הכלי");
      const endDate = fallback(data, "endDate");
      return {
        whatsapp: `${BRAND}\n⏰ *תזכורת החזרה*\n\nמחר (${endDate}) מועד ההחזרה של:\n${tool}\n\nאנא החזר במצב תקין לגמח.`,
        sms: `${BRAND_PLAIN}: תזכורת – החזרה של ${tool} מחר (${endDate}).`,
        email: {
          subject: `תזכורת החזרה – ${tool}`,
          body: `תזכורת ידידותית: מועד ההחזרה של ${tool} הוא ${endDate}.\n\nאנא ודא שהכלי תקין ומוחזר במועד.`,
        },
        push: { title: "תזכורת החזרה", body: `${tool} – ${endDate}`, url: "/my-loans" },
      };
    }

    case "LOAN_RETURNED_OK": {
      const tool = fallback(data, "toolName", "הכלי");
      const amount = fallback(data, "totalCharged", "0");
      return {
        whatsapp: `${BRAND}\n✅ *תודה על החזרה תקינה*\n\n${tool}\nחויב: ₪${amount}\nהפיקדון שוחרר.\n\nאשמח אם תדרג את הכלי: ${APP_URL}/catalog/${fallback(data, "toolId")}`,
        sms: `${BRAND_PLAIN}: ${tool} הוחזר תקין. חויב ₪${amount}, פיקדון שוחרר.`,
        email: {
          subject: `החזרה תקינה – ${tool}`,
          body: `תודה רבה על ההחזרה התקינה של ${tool}.\n\nחיוב סופי: ₪${amount}\nהפיקדון שוחרר במלואו.\n\nנשמח אם תדרג את הכלי: ${APP_URL}/catalog/${fallback(data, "toolId")}`,
        },
        push: {
          title: "החזרה תקינה",
          body: `${tool} – חויב ₪${amount}`,
          url: "/my-loans",
        },
      };
    }

    case "LOAN_OVERDUE": {
      const tool = fallback(data, "toolName", "הכלי");
      return {
        whatsapp: `${BRAND}\n⚠️ *החזרה באיחור/בנזק*\n\n${tool}\nהפיקדון נגבה והחשבון נחסם מהשאלות עתידיות. ניתן לפנות למנהל ראשי.`,
        sms: `${BRAND_PLAIN}: ${tool} – פיקדון נגבה, חשבון חסום.`,
        email: {
          subject: `החזרה באיחור/בנזק – ${tool}`,
          body: `דיווחה הגמח על איחור/נזק בהחזרת ${tool}.\n\nהפיקדון נגבה במלואו והחשבון שלך חסום מהשאלות עתידיות.\n\nניתן לפנות למנהל ראשי.`,
        },
        push: { title: "החזרה בעייתית", body: tool, url: "/profile" },
      };
    }

    case "WAITLIST_TURN": {
      const tool = fallback(data, "toolName", "הכלי שחיכית לו");
      return {
        whatsapp: `${BRAND}\n🔔 *הכלי שחיכית לו פנוי!*\n\n${tool}\n\nהזמן את ההשאלה לפני שמישהו אחר: ${APP_URL}/catalog/${fallback(data, "toolId")}`,
        sms: `${BRAND_PLAIN}: ${tool} פנוי כעת! ${APP_URL}/catalog/${fallback(data, "toolId")}`,
        email: {
          subject: `${tool} פנוי כעת`,
          body: `${tool} פנוי עכשיו להשאלה.\n\nהזמן לפני שמישהו אחר: ${APP_URL}/catalog/${fallback(data, "toolId")}`,
        },
        push: {
          title: "הכלי פנוי!",
          body: tool,
          url: `/catalog/${fallback(data, "toolId")}`,
        },
      };
    }

    case "TOOL_REQUEST_CREATED": {
      const desc = fallback(data, "description", "(תיאור)");
      const user = fallback(data, "userName");
      return {
        whatsapp: `${BRAND}\n🔧 *בקשת כלי חסר*\n\n${user} מבקש:\n${desc}\n\nניהול: ${APP_URL}/admin/tool-requests`,
        sms: `${BRAND_PLAIN}: בקשת כלי חסר מ-${user}.`,
        email: {
          subject: "בקשת כלי חסר חדשה",
          body: `${user} מבקש כלי חסר:\n\n${desc}\n\n${APP_URL}/admin/tool-requests`,
        },
        push: {
          title: "בקשת כלי חסר",
          body: desc.slice(0, 60),
          url: "/admin/tool-requests",
        },
      };
    }

    case "GEMACH_REQUEST_CREATED": {
      const name = fallback(data, "name");
      const phone = fallback(data, "phone");
      return {
        whatsapp: `${BRAND}\n🌱 *בקשת פתיחת גמח חדש*\n\n${name}\n${phone}`,
        sms: `${BRAND_PLAIN}: בקשת פתיחת גמח – ${name}, ${phone}.`,
        email: {
          subject: "בקשת פתיחת גמח חדש",
          body: `בקשה לפתיחת גמח חדש:\n\nשם: ${name}\nטלפון: ${phone}`,
        },
        push: { title: "בקשת גמח חדש", body: name, url: "/admin" },
      };
    }

    case "TOOL_DONATION_REQUEST": {
      const name = fallback(data, "donorName");
      const phone = fallback(data, "donorPhone");
      const desc = fallback(data, "toolDesc");
      return {
        whatsapp: `${BRAND}\n🎁 *הצעת תרומת כלי*\n\nמ-${name} (${phone}):\n${desc}`,
        sms: `${BRAND_PLAIN}: הצעת תרומת כלי מ-${name}.`,
        email: {
          subject: "הצעת תרומת כלי",
          body: `הוצעה תרומת כלי:\n\nמ: ${name}\nטלפון: ${phone}\nתיאור: ${desc}`,
        },
        push: { title: "תרומת כלי", body: name, url: "/admin" },
      };
    }
  }
}
