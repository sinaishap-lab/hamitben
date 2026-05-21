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
