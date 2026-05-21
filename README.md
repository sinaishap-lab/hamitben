# המתבן 🌾

> פלטפורמה לניהול גמחי כלי עבודה חקלאיים — השאלה, פיקדון וניהול קהילתי.
> Hebrew RTL, mobile-first, PWA-installable.

**גמחי השקה:** מזרח הגוש · תלם · דרום הר חברון

## טכנולוגיות

| שכבה | בחירה |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind |
| DB | PostgreSQL + Prisma 6 |
| Auth | NextAuth (credentials) + bcrypt |
| File storage | Cloudinary (signed uploads) |
| Payments | Cardcom Lowprofile (J2 pre-auth) — abstracted, runs in stub mode by default |
| Notifications | Twilio WhatsApp + SMS · Resend (email) · web-push (push) |
| Hosting | Vercel + Supabase (recommended) |
| Maps | Google Maps links |
| PWA | Custom service worker, no third-party wrapper |

## התחלה מהירה

```bash
npm install
cp .env.example .env.local       # מלא ערכים — לפחות DATABASE_URL + NEXTAUTH_SECRET
npm run db:push                  # אחרי שיש לך Postgres
npm run db:seed                  # יוצר admin + 3 מנהלי גמח + 3 גמחים
npm run dev                      # פותח על http://localhost:3000
```

ראה [`docs/SETUP.md`](docs/SETUP.md) להקמת Postgres (Supabase / Docker / Vercel Postgres).

## סקריפטים

| פקודה | פעולה |
|---|---|
| `npm run dev` | dev server (port 3000) |
| `npm run build` | build production |
| `npm run start` | production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | tsc --noEmit |
| `npm run db:push` | סנכרון סכמה ל-DB |
| `npm run db:seed` | יצירת admin + גמחים |
| `npm run db:studio` | Prisma Studio (GUI ל-DB) |

## מבנה תיקיות

```
app/
├── (auth)/             # /login, /register, /pending, /account-blocked
├── (main)/             # public + authenticated user pages
│   ├── catalog/        # ציבורי – קטלוג + דף כלי
│   ├── gemachs/[id]/   # ציבורי – דף גמח
│   ├── invite/         # הזמן חבר + סטטיסטיקות
│   ├── loans/new/      # בקשת השאלה (3 שלבים)
│   ├── my-loans/       # ההשאלות שלי
│   ├── profile/        # פרופיל + push opt-in + מחיקת חשבון
│   ├── donate/         # תרומה (Cardcom)
│   ├── contact/        # צור קשר
│   ├── about/          # אודות + 3 CTA
│   ├── tool-requests/new/
│   ├── gemach-requests/new/
│   ├── tool-donations/new/
│   └── terms/
├── (gemach-admin)/gemach/[id]/    # מנהל גמח: dashboard / tools / loans / settings
├── (admin)/admin/                 # מנהל ראשי: index + users / gemachs / tool-requests / gemach-requests / tool-donations
└── api/                           # כל ה-route handlers
components/
├── ui/                 # Button, Input, FormField, Alert, Badge, Skeleton
├── layout/             # TopBar, BottomNav
├── tools/              # ToolCard, ToolFilters, ToolForm, ImageUploader
├── loans/              # LoanStatusBadge
├── gemach/             # GemachEditForm
└── pwa/                # SW registrar, install prompt, push opt-in
lib/
├── prisma.ts           # singleton client
├── auth.ts             # NextAuth + auth()/getCurrentUser()
├── api-helpers.ts      # requireSession()/requireRole()
├── validation.ts       # zod schemas
├── labels.ts           # Hebrew labels per enum
├── utils.ts            # cn(), formatShekel(), formatDateHe()
├── loans.ts            # loadLoanForManager() helper
├── waitlist.ts         # notifyNextInWaitlist
├── cloudinary.ts       # signUpload()
├── payments/           # provider abstraction + stub + cardcom skeleton
└── notifications/      # WhatsApp/SMS/email/push + templates + dispatcher
prisma/
├── schema.prisma       # מודלים מלאים לפי האפיון
└── seed.ts
public/
├── manifest.json       # PWA
├── sw.js               # Service Worker (cache + push)
├── logo.svg            # ראשי
└── icon-*.svg          # PWA icons (any + maskable)
middleware.ts           # role-based route guards
```

## איך פיצ'רים מרכזיים עובדים

### זרימת השאלה (§4)
1. משתמש בוחר תאריכים + מאשר תנאים
2. `POST /api/loans` נועל פיקדון דרך `PaymentProvider.createDepositHold` (stub→מיידי, Cardcom→redirect)
3. תלוי בכלי: `autoApprove=true` → APPROVED מיד, אחרת PENDING למנהל
4. מנהל גמח: approve → ACTIVE עם collect → RETURNED/OVERDUE עם return
5. RETURNED → void deposit + charge dailyRate×days; OVERDUE → capture deposit + ban user

### Referral (§16.2)
- `User.referralCode` ייחודי לכל משתמש
- B נרשם דרך `/register?ref=YOSSI42` → `referredById` נשמר
- B מבקש השאלה ראשונה → A מקבל +1 `discountTokens`
- A מסמן בטופס "נצל אסימון" → decrement + flag → 10% הנחה בחישוב הסופי

### Waitlist (§20.1)
- כלי תפוס: כפתור "הצטרף לרשימת המתנה" → `Waitlist` עם position
- מנהל מחזיר כלי → `notifyNextInWaitlist` → WhatsApp+Push לראש התור
- DELETE שולח עוד אחד למעלה (decrement positions)

### Notifications (§7.4)
- 13 ארועים × 4 ערוצים (WhatsApp/SMS/email/push)
- `notifyUser(userId, event, data)` שולח לכל הערוצים במקביל
- בלי env vars → stub mode (console.log)
- Daily cron `/api/cron/loan-reminders` מזכיר 24h לפני החזרה

## תיעוד נוסף

- [`docs/המתבן_תכנון_פרוייקט.md`](docs/המתבן_תכנון_פרוייקט.md) — מסמך אפיון מלא
- [`docs/SETUP.md`](docs/SETUP.md) — הקמת DB מקומי
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — checklist לדפלוי production
- [`CLAUDE.md`](CLAUDE.md) — הוראות לעבודה עתידית מול Claude

## תרומות לפיתוח

הפרוייקט פתוח להצעות. לפני שינויים גדולים — פתח issue.
