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

## מצב נוכחי

- 11 שלבי הפיתוח הושלמו לפי האפיון
- בילד עובר נקי (`tsc`, `lint`, `build`)
- DB טרם הוקם (משתמש יבחר Supabase/Docker/Vercel)
- Cardcom יושב במצב stub עד שמתקבל חשבון עסקי

לפני הפעלת production, ראה [`docs/DEPLOY.md`](docs/DEPLOY.md).
