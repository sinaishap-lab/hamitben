import { z } from "zod";

/** Normalise an Israeli phone number – strip spaces/dashes, return digits-only string. */
export function normalizeIsraeliPhone(raw: string): string {
  return raw.replace(/[\s\-+()]/g, "").replace(/^972/, "0");
}

/** Israeli phone validator – accepts 0XXXXXXXX or 0XXXXXXXXX after normalisation. */
const israeliPhone = z
  .string()
  .trim()
  .transform(normalizeIsraeliPhone)
  .pipe(
    z
      .string()
      .regex(/^0\d{8,9}$/, "מספר טלפון לא תקין (פורמט: 05XXXXXXXX)")
  );

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "שם קצר מדי")
    .max(80, "שם ארוך מדי"),
  phone: israeliPhone,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("כתובת אימייל לא תקינה"),
  password: z
    .string()
    .min(8, "סיסמה חייבת להכיל לפחות 8 תווים")
    .max(100, "סיסמה ארוכה מדי"),
  termsAccepted: z.literal(true, { message: "יש לאשר את התקנון" }),
  referralCode: z.string().trim().optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  phone: israeliPhone,
  password: z.string().min(1, "יש להזין סיסמה"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "שם קצר מדי").max(80),
  email: z.string().trim().toLowerCase().email("כתובת אימייל לא תקינה"),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Admin-only — change anything about a user. UI guards self-modification of
// role/status/isBanned; the API also enforces it as a safety net.
export const userAdminUpdateSchema = z.object({
  name: z.string().trim().min(2, "שם קצר מדי").max(80).optional(),
  phone: israeliPhone.optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("כתובת אימייל לא תקינה")
    .optional(),
  role: z.enum(["REGULAR", "GEMACH_MANAGER", "ADMIN"]).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
  isBanned: z.boolean().optional(),
  banReason: z.string().trim().max(300).optional().nullable(),
});
export type UserAdminUpdateInput = z.infer<typeof userAdminUpdateSchema>;

const optionalCoord = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = typeof v === "string" ? parseFloat(v) : v;
    return Number.isFinite(n) ? n : null;
  });

export const gemachCreateSchema = z.object({
  name: z.string().trim().min(2, "שם קצר מדי").max(80),
  description: z.string().trim().max(500).optional().nullable(),
  address: z.string().trim().min(2, "כתובת חסרה").max(200),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? normalizeIsraeliPhone(v) : null)),
  lat: optionalCoord,
  lng: optionalCoord,
  imageUrl: z.string().trim().url().optional().nullable(),
  managerPhone: israeliPhone, // existing user phone (must be APPROVED)
});

export type GemachCreateInput = z.infer<typeof gemachCreateSchema>;

// Update keeps every field optional, including managerPhone — admin can use
// it to reassign the gemach to a different manager (handled in the PUT route).
export const gemachUpdateSchema = gemachCreateSchema.partial();

export type GemachUpdateInput = z.infer<typeof gemachUpdateSchema>;

const optionalNum = (min: number, max?: number) =>
  z
    .union([z.number(), z.string()])
    .transform((v) => {
      const n = typeof v === "string" ? parseFloat(v) : v;
      return Number.isFinite(n) ? n : 0;
    })
    .pipe(
      max !== undefined
        ? z.number().min(min, `מספר קטן מדי`).max(max, `מספר גדול מדי`)
        : z.number().min(min, `מספר קטן מדי`)
    );

export const toolCreateSchema = z.object({
  name: z.string().trim().min(2, "שם קצר מדי").max(80),
  description: z.string().trim().max(1000).optional().nullable(),
  categoryId: z.string().min(1, "יש לבחור קטגוריה"),
  images: z.array(z.string().url()).max(5).default([]),
  autoApprove: z.boolean().default(false),
  depositAmount: optionalNum(0).default(0),
  dailyRate: optionalNum(0).default(0),
  maxDays: optionalNum(1, 365).default(7),
  gemachId: z.string().min(1, "גמח חסר"),
});

export type ToolCreateInput = z.infer<typeof toolCreateSchema>;

export const toolUpdateSchema = toolCreateSchema.omit({ gemachId: true }).partial();
export type ToolUpdateInput = z.infer<typeof toolUpdateSchema>;

export const toolRequestCreateSchema = z.object({
  description: z.string().trim().min(3, "תיאור קצר מדי").max(500),
  categoryId: z.string().min(1).optional().nullable(),
  gemachId: z.string().min(1).optional().nullable(),
});
export type ToolRequestCreateInput = z.infer<typeof toolRequestCreateSchema>;

// ─── Categories (admin-managed) ───
export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, "שם קצר מדי").max(40, "שם ארוך מדי"),
  icon: z.string().trim().min(1).max(40).default("Tag"),
  sortOrder: optionalNum(0, 999).default(0),
});
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

export const categoryUpdateSchema = categoryCreateSchema.partial();
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}/, "פורמט תאריך לא חוקי")
  .transform((s) => new Date(s));

export const loanCreateSchema = z
  .object({
    toolId: z.string().min(1, "כלי חסר"),
    startDate: isoDate,
    endDate: isoDate,
    purpose: z.string().trim().max(300).optional().nullable(),
    termsAcknowledged: z.literal(true, {
      message: "יש לאשר את תנאי השאלה",
    }),
    useDiscountToken: z.boolean().optional().default(false),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "תאריך סיום חייב להיות אחרי תאריך התחלה",
    path: ["endDate"],
  });

export type LoanCreateInput = z.infer<typeof loanCreateSchema>;

export const loanReturnSchema = z.object({
  outcome: z.enum(["OK", "OVERDUE"]),
  notes: z.string().trim().max(500).optional().nullable(),
});
export type LoanReturnInput = z.infer<typeof loanReturnSchema>;

export const loanRejectSchema = z.object({
  reason: z.string().trim().max(300).optional().nullable(),
});

export const donationSchema = z.object({
  amount: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "string" ? parseFloat(v) : v))
    .pipe(z.number().int("סכום חייב להיות מספר שלם").min(10, "מינימום ₪10").max(100000)),
  name: z.string().trim().max(80).optional().nullable(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("כתובת אימייל לא תקינה")
    .optional()
    .nullable(),
});
export type DonationInput = z.infer<typeof donationSchema>;

export const gemachRequestSchema = z.object({
  name: z.string().trim().min(2, "שם קצר מדי").max(80),
  phone: israeliPhone,
});
export type GemachRequestInput = z.infer<typeof gemachRequestSchema>;

export const toolDonationSchema = z.object({
  donorName: z.string().trim().min(2, "שם קצר מדי").max(80),
  donorPhone: israeliPhone,
  toolDesc: z.string().trim().min(3, "תיאור קצר מדי").max(500),
});
export type ToolDonationInput = z.infer<typeof toolDonationSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "שם קצר מדי").max(80),
  phone: israeliPhone,
  subject: z.string().trim().min(2, "נושא חסר").max(120),
  message: z.string().trim().min(5, "הודעה קצרה מדי").max(2000),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const reviewCreateSchema = z.object({
  toolId: z.string().min(1, "כלי חסר"),
  rating: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "string" ? parseInt(v, 10) : v))
    .pipe(z.number().int().min(1, "יש לבחור דירוג").max(5)),
  comment: z.string().trim().max(500).optional().nullable(),
});
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
