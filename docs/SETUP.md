# הקמת סביבת פיתוח – המתבן

## דרישות
- Node.js 18+ (יש לך 24.13.0 ✅)
- npm 10+ (יש לך 11.8 ✅)
- Postgres 14+ (חסר – ראה אופציות מטה)

## הקמת Postgres

בחר אחת מהאופציות הבאות והעתק את ה-`DATABASE_URL` ל-`.env.local`.

### אופציה A – Supabase (מומלץ ל-production)
1. הירשם בחינם ב-[supabase.com](https://supabase.com)
2. צור פרוייקט חדש (בחר אזור EU-West-2 או דומה)
3. Settings → Database → Connection string → URI
4. העתק והדבק ב-`.env.local`:
   ```
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

### אופציה B – Postgres מקומי דרך Docker
```bash
docker run --name hamitben-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hamitben -p 5432:5432 -d postgres:16
```
ה-DATABASE_URL ב-`.env.local` כבר מצביע על localhost:5432 — תעבוד מיד.

### אופציה C – Vercel Postgres / Neon
מתאים אם אתה כבר מתכנן לפרוס ל-Vercel. צור דרך Vercel Dashboard → Storage → Create.

## אתחול הסכמה והסיד

לאחר שה-`DATABASE_URL` מוגדר:
```bash
npm run db:push       # יוצר את כל הטבלאות
npm run db:seed       # יוצר admin + 3 מנהלי גמח + 3 גמחי השקה
```

### Defaults שיווצרו ע"י הסיד
| תפקיד | טלפון | סיסמה |
|------|-------|------|
| מנהל ראשי | 050-0000000 (קונפיגורבילי דרך `ADMIN_PHONE`) | `ChangeMe!2026` |
| מנהל מזרח הגוש | 050-0000001 | `ChangeMe!2026` |
| מנהל תלם | 050-0000002 | `ChangeMe!2026` |
| מנהל דרום הר חברון | 050-0000003 | `ChangeMe!2026` |

**⚠️ החלף סיסמאות אלה לפני production!**

## הרצה
```bash
npm run dev
```
ופתח [http://localhost:3000](http://localhost:3000).

## הוראות שירותים חיצוניים (לשלבים מתקדמים)

- **Cloudinary** (תמונות כלים – שלב 3) – הירשם, העתק 3 קלידים ל-`.env.local`
- **Twilio** (WhatsApp/SMS – שלב 6) – נדרש אישור עסקי לשליחה ב-WhatsApp ל-IL
- **Cardcom** (תשלומים – שלב 5) – נדרש חשבון עסקי + טרמינל
- **Resend** (אימייל – שלב 6) – אימות דומיין hamitben.co.il
