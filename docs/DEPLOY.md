# DEPLOY checklist – המתבן

צ'ק-ליסט סופי לפני העלאת המערכת ל-production.

## 1. בסיס נתונים

- [ ] חשבון Supabase נפתח (או Vercel Postgres / Neon)
- [ ] `DATABASE_URL` של pooler (`pgbouncer=true`) שמור באופן בטוח
- [ ] `npx prisma db push` רץ ללא שגיאות
- [ ] `npx prisma db seed` יצר admin + 3 גמחים — סיסמאות ברירת מחדל הוחלפו

## 2. שירותים חיצוניים

### Cloudinary (תמונות כלים)
- [ ] חשבון Cloudinary נפתח (free tier מספיק לתחילה)
- [ ] `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` ב-env

### Twilio (WhatsApp + SMS)
- [ ] חשבון Twilio נפתח
- [ ] Sandbox WhatsApp פעיל לבדיקה / WhatsApp Business Profile אושר ל-production
- [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` ב-env
- [ ] `TWILIO_WHATSAPP_NUMBER` ו-`TWILIO_SMS_NUMBER` תקפים

### Resend (אימייל)
- [ ] חשבון Resend נפתח
- [ ] דומיין `hamitben.co.il` (או חלופה) אומת ב-Resend
- [ ] `RESEND_API_KEY`, `RESEND_FROM_EMAIL` ב-env

### Cardcom (תשלומים)
- [ ] חשבון עסקי Cardcom נפתח ואושר (ייקח 1-2 שבועות)
- [ ] Sandbox terminal לבדיקה ב-staging
- [ ] `CARDCOM_TERMINAL`, `CARDCOM_USERNAME`, `CARDCOM_API_NAME` ב-env
- [ ] `CARDCOM_WEBHOOK_SECRET` הוגדר
- [ ] `PAYMENT_PROVIDER=cardcom` (לא `stub`)
- [ ] בקובץ `lib/payments/cardcom.ts` הוסרו ה-`throw` והופעלו קריאות `fetch` (ראה comments)

### Web Push (VAPID)
- [ ] הרצנו `npx web-push generate-vapid-keys` וקיבלנו זוג מפתחות
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` ב-env

### Google Maps (אופציונלי)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_KEY` ב-env (כרגע משמש רק ללינקים, ללא API call)

## 3. משתני סביבה הכרחיים (Vercel)

```
DATABASE_URL                                  # Supabase pooler URL
NEXTAUTH_SECRET                               # openssl rand -base64 32
NEXTAUTH_URL                                  # https://hamitben.co.il

ADMIN_PHONE                                   # מספר המנהל הראשי
ADMIN_EMAIL                                   # אימייל המנהל הראשי
ADMIN_PASSWORD                                # סיסמת אדמין ראשונית

TERMS_VERSION                                 # 1.0

PAYMENT_PROVIDER                              # cardcom (אחרי שהמערכת מאושרת) / stub
CARDCOM_TERMINAL
CARDCOM_USERNAME
CARDCOM_API_NAME
CARDCOM_WEBHOOK_SECRET

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_NUMBER
TWILIO_SMS_NUMBER

RESEND_API_KEY
RESEND_FROM_EMAIL

NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_EMAIL

CRON_SECRET                                   # openssl rand -hex 32 (לתזכורות יומיות)
```

## 4. Vercel deployment

- [ ] `vercel link` או import דרך Vercel dashboard
- [ ] משתני סביבה הוגדרו ב-Production + Preview
- [ ] Build & Output Settings: Framework=Next.js, Node 20+ (build), Install=`npm install`
- [ ] Vercel Cron Job פעיל (`vercel.json` כבר מוגדר)
- [ ] Domain `hamitben.co.il` הוקצה ל-Production
- [ ] DNS verifyed + SSL פעיל (אוטומטית ע"י Vercel)
- [ ] `https://hamitben.co.il/api/health?deep=1` מחזיר 200

## 5. QA ידני (לפני go-live)

- [ ] הרשמת משתמש חדש → admin מקבל WhatsApp/email
- [ ] Admin מאשר → משתמש מקבל WhatsApp/email
- [ ] משתמש שולח בקשת השאלה → מנהל גמח מקבל התראה
- [ ] מנהל גמח מאשר → משתמש מקבל התראה
- [ ] מסמן "הוחזר תקין" → פיקדון שוחרר (לבדוק ב-Cardcom dashboard)
- [ ] מסמן "נזק/איחור" → פיקדון נגבה + משתמש חסום
- [ ] רישום ל-PWA מהמסך הביתי באנדרואיד/iOS
- [ ] Push notification מתקבלת אחרי opt-in בפרופיל
- [ ] תרומה דרך `/donate` עוברת ב-Cardcom
- [ ] `https://hamitben.co.il/api/cron/loan-reminders` עם `Authorization: Bearer $CRON_SECRET` רץ נקי
- [ ] בודק את העמודים בעברית RTL במובייל אמיתי (iOS Safari + Android Chrome)

## 6. שיקולי אבטחה

- [x] הסיסמאות מאוחסנות עם bcrypt (cost 10)
- [x] NextAuth session דרך JWT — לא DB sessions (פחות עומס)
- [x] Middleware חוסם נתיבי admin/gemach לא-מורשים
- [x] HSTS + X-Frame-Options + Permissions-Policy ב-`next.config.mjs`
- [x] Cardcom webhook מאומת דרך `CARDCOM_WEBHOOK_SECRET`
- [x] Cron endpoints מוגנים ב-`Authorization: Bearer $CRON_SECRET`
- [ ] בדיקת `npm audit` לפני production
- [ ] Sentry / monitoring (אופציונלי)

## 7. תחזוקה שוטפת

- בדיקת `/admin` mainit weekly (ממתינים לאישור, בקשות גמח, נזקים)
- בדיקת לוגים של Vercel Cron (לוודא שהתזכורות שולחות)
- מעקב אחרי `discountTokens` ו-referral patterns
- גיבוי DB יומי (Supabase מציע אוטומטית)
