import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "תנאי השימוש",
  description: "תקנון ותנאי השימוש של המתבן",
};

// Placeholder legal text. Replace with reviewed legal copy before production.
export default function TermsPage() {
  return (
    <article className="px-4 py-6 prose prose-sm max-w-none rtl">
      <h1 className="text-2xl font-bold text-primary mb-2">תקנון ותנאי שימוש</h1>
      <p className="text-xs text-text-muted mb-6">
        גרסה {process.env.TERMS_VERSION || "1.0"} · עודכן לאחרונה במאי 2026
      </p>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="font-bold text-lg">1. כללי</h2>
        <p>
          המתבן הוא שירות קהילתי להשאלת כלי עבודה חקלאיים בין חברי גמחים שותפים. השימוש בשירות
          מותנה בהסכמה לתנאים אלה.
        </p>

        <h2 className="font-bold text-lg">2. הרשמה ואישור</h2>
        <p>
          ההרשמה דורשת מסירת פרטים אמיתיים (שם, טלפון, אימייל). חשבון המשתמש כפוף לאישור מנהל
          ראשי. בקשת השאלה ניתנת רק לחשבונות שאושרו.
        </p>

        <h2 className="font-bold text-lg">3. פיקדון וחיוב</h2>
        <p>
          לכל השאלה ייגבה פיקדון בכרטיס אשראי באמצעות נעילת סכום (pre-authorization). הפיקדון
          ישוחרר בהחזרה תקינה ובמועד. בעת איחור או נזק – הפיקדון ייגבה במלואו והמשתמש ייחסם
          מהשאלות עתידיות.
        </p>

        <h2 className="font-bold text-lg">4. אחריות השואל</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>איסוף הכלי במועד שנקבע מהגמח</li>
          <li>החזרת הכלי במצב תקין, נקי ופועל</li>
          <li>החזרת הכלי עד תאריך הסיום</li>
          <li>דיווח מיידי על תקלה או נזק</li>
        </ul>

        <h2 className="font-bold text-lg">5. ביטול בקשה</h2>
        <p>
          ניתן לבטל בקשת השאלה כל עוד טרם אושרה. לאחר אישור – ביטול בכפוף לתיאום עם מנהל הגמח.
        </p>

        <h2 className="font-bold text-lg">6. הגנת פרטיות</h2>
        <p>
          פרטי המשתמש נשמרים לצורך תפעול השירות בלבד ולא יועברו לצדדים שלישיים. ניתן למחוק
          חשבון בכל עת מדף הפרופיל; היסטוריית ההשאלות תישמר אנונימית לצרכי תפעול הגמח.
        </p>

        <h2 className="font-bold text-lg">7. שינוי תנאים</h2>
        <p>
          המתבן רשאי לעדכן תנאים אלה. עדכון מהותי יחייב חתימה מחודשת בכניסה הבאה.
        </p>
      </section>
    </article>
  );
}
