# CLAUDE.md

הוראות עבודה עבור Claude (או כל מפתח אחר) הניגש לפרוייקט בפעם הראשונה.

## TL;DR

המתבן = פלטפורמה לגמחי כלי עבודה חקלאיים בעברית, RTL, mobile-first.
**Stack:** Next.js 14 App Router + Prisma + Postgres + NextAuth + Cardcom + Twilio.
**אפיון מלא:** [`docs/המתבן_תכנון_פרוייקט.md`](docs/המתבן_תכנון_פרוייקט.md).

## עקרונות עבודה בפרוייקט

1. **הכל בעברית RTL.** UI, הודעות שגיאה, validation messages, אימיילים, WhatsApp.
   `<html lang="he" dir="rtl">`. `text-align: right` ברירת מחדל.
2. **Mobile-first.** ה-Layout מוגבל ל-`max-w-screen-sm` (480px). אם מוסיפים breakpoints אז `sm:`, `md:` למסך גדול.
3. **Spec is source of truth.** כל החלטה גדולה צריכה להתאים ל-`docs/המתבן_תכנון_פרוייקט.md`. אם משהו שונה, עדכן את הספק.
4. **Schema-driven.** מודלים Prisma הם המקור. Validation דרך zod שמייצא טיפוסים. UI labels מ-`lib/labels.ts`.
5. **Provider abstractions לתשלומים והתראות.** אל תקרא ישירות ל-Cardcom או Twilio. השתמש ב-`lib/payments` ו-`lib/notifications`. ברירת מחדל = stub mode עד שיש creds.
6. **בדוק אחרי כל שינוי:** `npm run typecheck && npm run lint && npm run build`.

## מבנה הקוד

ראה [`README.md`](README.md) למבנה תיקיות מלא.

### Conventions

- Server components פותחים בקריאת `auth()` או `getCurrentUser()` כשצריך משתמש.
- Client components מתחילים עם `"use client"`. כשמשתמשים ב-`useSearchParams` מחויב `<Suspense>` אבא.
- API routes: zod parse → permission check → DB → notify → response. תמיד try/catch מסביב ל-Prisma + payment + notification.
- Hebrew copy לא נמצא ב-templates אלא inline בכל component — לא משתמשים ב-i18n library. אם יום אחד רוצים i18n, יש לעבור על כל ה-Hebrew strings.

### עיצוב

פלטה ב-`tailwind.config.ts` (סעיף 10 באפיון). שמות סמנטיים: `primary`, `secondary`, `accent`, `bg`, `text-muted`, `success`, `warning`, `error`. **אל תוסיף צבעים hardcoded — תוסיף לפלטה.**

פונט: Heebo דרך `next/font/google`, משקלים 300-900.

## פעולות נפוצות

### הוספת אירוע התראה חדש

1. הוסף ערך ל-`NotificationEvent` ב-`lib/notifications/types.ts`
2. הוסף את התבנית ב-`lib/notifications/templates.ts` (4 ערוצים)
3. קרא `notifyUser(userId, event, data)` בנקודת השינוי

### הוספת שדה חדש למודל

1. עדכן `prisma/schema.prisma`
2. `npm run db:generate` (TypeScript)
3. `npm run db:push` (DB)
4. עדכן את ה-validation schema הרלוונטי ב-`lib/validation.ts`
5. עדכן את ה-UI ואת ה-API endpoint

### הוספת payment provider חדש

1. צור `lib/payments/<name>.ts` המממש את `PaymentProvider`
2. רשום ב-`lib/payments/index.ts` factory
3. הגדר `PAYMENT_PROVIDER=<name>` ב-env

### עבודה בלי DB (stub mode)

בלי `DATABASE_URL` תקין, רוב הדפים יזרקו. דפים שעובדים: `/`, `/login`, `/register`, `/terms`, `/pending`. אם רוצים להריץ סשן בלי DB, מומלץ להקים Postgres מקומי דרך Docker (ראה `docs/SETUP.md`).

## דברים שצריך לזכור

- **Loan state machine**: PENDING → APPROVED → ACTIVE → RETURNED|OVERDUE; PENDING|APPROVED → CANCELLED; PENDING → REJECTED. שינויים בstate machine צריכים להתבצע ב-API routes הספציפיים, לא במסלול אחד.
- **Soft deletes**: User → `deletedAt`. Tool → `isActive=false`. לעולם אל תמחק שורות פיזית — היסטוריית השאלות תישבר.
- **Banned users**: לא יכולים לבקש השאלה. `middleware.ts` חוסם את הנתיב + `POST /api/loans` בודק שוב.
- **Pre-auth vs charge**: pre-auth מנעל סכום בכרטיס ללא חיוב. בהחזרה תקינה — voidDeposit (משחרר) + chargeFinal (חיוב יומי × ימים). בהחזרה גרועה — captureDeposit (גובה את הפיקדון במלואו).
- **Cardcom webhook**: redirect-mode בלבד. ב-stub mode זה לא רץ.
- **Vercel cron**: מוגדר ב-`vercel.json`, נתיב `/api/cron/loan-reminders` (יומי 6 AM UTC).

## מצב נוכחי (עודכן 2026-05-22)

### בסיס + פריסה
- **11 שלבי האפיון הושלמו** + אצוות שיפורים גדולות אחרי האפיון (ראה למטה).
- **DB חי על Supabase** — region Tokyo (`ap-northeast-1`), Session pooler.
  `DATABASE_URL` ב-`.env`+`.env.local` עם `?connection_limit=5&pool_timeout=20`
  (ה-pooler מוגבל ל-15 חיבורים — חובה להגביל את Prisma).
- **Cloudinary מוגדר ופעיל** — העלאות תמונות אמיתיות עובדות.
- **Twilio / Resend / web-push / Cardcom** — עדיין stub mode (console.log / IDs מזויפים).
- בילד עובר נקי (`tsc`, `lint`, `build`).
- **חשבון בדיקה (admin):** טלפון `0508283648` סיסמה `Sinai2026!`.
  מנהלי גמח מה-seed: `0500000001/2/3` סיסמה `ChangeMe!2026`.

### העלאת תמונות — איך זה עובד עכשיו
- **לא** signed-direct-upload. הדפדפן שולח את הקובץ ל-`POST /api/upload`,
  השרת מעלה ל-Cloudinary דרך `cloudinary.uploader.upload` (`lib/cloudinary.ts → uploadImage`).
- `ImageUploader` מבצע downscale ל-1600px JPEG בדפדפן לפני ההעלאה (גבול שרת 5MB).
- בלי Cloudinary → fallback להדבקת URL.

### פיצ'רים שנוספו אחרי האפיון (סשני שיפור UX)
- **מבנה ניווט חדש:** `/` הוא דף נחיתה לאורחים בלבד (משתמש מחובר → redirect ל-`/catalog` או `/admin`).
  BottomNav = 4 פריטים (קטלוג / השאלותיי / אודות / צור קשר). פרופיל דרך **אווטר** ב-TopBar.
- **אורח:** אווטר "אורח" מופיע רק אחרי בחירה ב"כניסה כאורח" (cookie `hamitben_guest`). דף `/guest`.
- **`/welcome`** — מסך ברוכים-הבאים אישי אחרי כניסה.
- **התנתקות** — TopBar + דף פרופיל (`LogoutButton`).
- **קטלוג מחודש:** כותרת ממורכזת, פילטרים לפי קטגוריה/זמינות/גמח, chips קטגוריה נפרשים עם אייקונים,
  זמינות = היום/מחר, מיון newest-first + תווית "חדש".
- **מועדפים** (`Favorite` model): לב על כרטיס + דף `/favorites` + התראת `FAVORITE_AVAILABLE` כשכלי מתפנה.
- **ביקורות מאומתות** (`Review` + `@@unique([userId,toolId])`): רק מי שהשאיל בפועל (loan RETURNED/OVERDUE) מדרג, פעם אחת. `/api/reviews`.
- **תווית "מבוקש"** (flame) + **תאריך התפנות** לכלי תפוס (`lib/availability.ts`).
- **סוויפ בין תמונות** בגלריה.
- טפסי גמח — הוסרו lat/lng. `/admin/gemachs` — סטטיסטיקות (כלים/השאלות/הכנסות).

### בעבודה / מתוכנן
- **ניהול קטגוריות** — refactor של `ToolCategory` enum → טבלת `Category` + מסך `/admin/categories`.
  מתוכנן (tasks בקובץ המשימות), טרם בוצע. דורש 2 שלבי `db push` + סקריפט backfill.

### שינויי סכמה שכבר בוצעו (מעבר לאפיון המקורי)
- `Loan.referralDiscountApplied` · `Favorite` model · `Review @@unique([userId, toolId])`.

### בעיות ידועות (מ-code review)
- Race condition בבדיקת חפיפת תאריכים ב-`POST /api/loans` (אין lock).
- אדמין יכול לחסום/לדחות את עצמו — אין guard.
- אין rate-limiting על endpoints ציבוריים.
- Cardcom webhook — אימות חתימה עדיין `TODO`.

### Git
שני commits: `fc658ae` (שלבים 1-2), `2d9c608` (שלבים 3-11). **כל עבודת ה-UX וה-favorites/reviews/קטלוג של הסשנים האחרונים — עדיין לא מקומיט.**

לפני הפעלת production, ראה [`docs/DEPLOY.md`](docs/DEPLOY.md).
