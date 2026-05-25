"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sprout, Plus } from "lucide-react";
import type { UserRole, UserStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { USER_ROLE, USER_STATUS } from "@/lib/labels";

type Values = {
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isBanned: boolean;
  banReason: string;
};

type FieldErrors = Partial<Record<keyof Values, string[]>>;

const ROLES = Object.keys(USER_ROLE) as UserRole[];
const STATUSES = Object.keys(USER_STATUS) as UserStatus[];

export function UserEditForm({
  userId,
  initial,
  isSelf,
  currentGemach,
  gemachs,
}: {
  userId: string;
  initial: Values;
  isSelf: boolean;
  /** The gemach this user already manages, if any. */
  currentGemach: { id: string; name: string } | null;
  /** All active gemachs — for the assignment dropdown. */
  gemachs: { id: string; name: string; managerName: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [assignToGemachId, setAssignToGemachId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function setField<K extends keyof Values>(key: K, val: Values[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setServerError(null);

    // Send only fields that actually changed.
    const payload: Partial<Values> = {};
    (Object.keys(values) as (keyof Values)[]).forEach((k) => {
      if (values[k] !== initial[k]) {
        // @ts-expect-error narrow generic
        payload[k] = values[k];
      }
    });
    // Self can't push these — server would reject anyway, drop early.
    if (isSelf) {
      delete payload.role;
      delete payload.status;
      delete payload.isBanned;
    }
    const wantsAssign =
      values.role === "GEMACH_MANAGER" &&
      !currentGemach &&
      assignToGemachId !== "";

    if (Object.keys(payload).length === 0 && !wantsAssign) {
      router.push("/admin/users");
      return;
    }

    try {
      // 1. Update the user first (so role / status reflect before assignment).
      if (Object.keys(payload).length > 0) {
        const res = await fetch(`/api/users/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.error === "VALIDATION") {
            setErrors(data.issues as FieldErrors);
          } else if (data.error === "DUPLICATE") {
            setErrors({ [data.field]: [data.message] } as FieldErrors);
          } else {
            setServerError(data.message ?? "שמירה נכשלה");
          }
          return;
        }
      }

      // 2. If admin chose a gemach to assign this user to, reassign it
      //    (sends managerPhone — the gemach API does the role swap atomically).
      if (wantsAssign) {
        const res = await fetch(`/api/gemachs/${assignToGemachId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ managerPhone: values.phone }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setServerError(
            data.message ?? "שיוך הגמח נכשל — פרטי המשתמש כבר נשמרו"
          );
          return;
        }
      }

      router.push("/admin/users");
      router.refresh();
    } catch {
      setServerError("בעיית רשת");
    } finally {
      setLoading(false);
    }
  }

  // Role-derived UI: show the gemach-assignment section whenever the user
  // is (or is becoming) a gemach manager.
  const showGemachSection = values.role === "GEMACH_MANAGER";
  // Other gemachs the user isn't already managing — eligible for assignment.
  const otherGemachs = gemachs.filter((g) => g.id !== currentGemach?.id);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {serverError && <Alert variant="error">{serverError}</Alert>}

      {isSelf && (
        <Alert variant="info">
          לא ניתן לשנות את התפקיד / הסטטוס / החסימה של עצמך — כדי לעשות זאת,
          תפנה לאדמין אחר.
        </Alert>
      )}

      <FormField label="שם מלא" htmlFor="name" required error={errors.name?.[0]}>
        <Input
          id="name"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          invalid={!!errors.name}
          required
        />
      </FormField>

      <FormField
        label="מספר טלפון"
        htmlFor="phone"
        required
        hint="פורמט: 05XXXXXXXX"
        error={errors.phone?.[0]}
      >
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          value={values.phone}
          onChange={(e) => setField("phone", e.target.value)}
          invalid={!!errors.phone}
          required
        />
      </FormField>

      <FormField label="אימייל" htmlFor="email" required error={errors.email?.[0]}>
        <Input
          id="email"
          type="email"
          dir="ltr"
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          invalid={!!errors.email}
          required
        />
      </FormField>

      <FormField label="תפקיד" htmlFor="role" required error={errors.role?.[0]}>
        <select
          id="role"
          value={values.role}
          onChange={(e) => setField("role", e.target.value as UserRole)}
          disabled={isSelf}
          className="w-full h-11 px-3 rounded-xl border border-primary-100 bg-bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-primary disabled:opacity-60"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {USER_ROLE[r]}
            </option>
          ))}
        </select>
      </FormField>

      {/* Gemach management — only when the user is a (or being promoted to)
          gemach manager. Models the two real flows: link to an existing
          gemach, or spin up a new one. */}
      {showGemachSection && (
        <section className="bg-primary-50/40 rounded-2xl border border-primary-100/60 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm">
            <Sprout className="w-4 h-4 text-primary" aria-hidden />
            ניהול גמח
          </div>

          {currentGemach ? (
            <div className="flex flex-col gap-1.5 text-sm">
              <span className="text-text-muted">משתמש זה מנהל כעת את:</span>
              <Link
                href={`/admin/gemachs/${currentGemach.id}/edit`}
                className="font-bold text-primary underline"
              >
                {currentGemach.name}
              </Link>
              <p className="text-xs text-text-muted">
                כדי להעביר אותו לגמח אחר — צריך קודם להחליף את המנהל של הגמח
                הנוכחי (דרך עריכת הגמח).
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-text-muted">
                המשתמש עדיין לא משויך לגמח. אפשר לשייך אותו לגמח קיים, או לפתוח
                גמח חדש עבורו.
              </p>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="assign-gemach"
                  className="text-xs font-medium text-text-muted"
                >
                  שייך לגמח קיים
                </label>
                <select
                  id="assign-gemach"
                  value={assignToGemachId}
                  onChange={(e) => setAssignToGemachId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-primary-100 bg-bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-primary"
                >
                  <option value="">— ללא שיוך —</option>
                  {otherGemachs.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (מנהל נוכחי: {g.managerName})
                    </option>
                  ))}
                </select>
                {assignToGemachId && (
                  <p className="text-xs text-warning">
                    שים לב: המנהל הנוכחי של הגמח יוחזר לתפקיד &quot;משתמש רגיל&quot;.
                  </p>
                )}
              </div>

              <Link
                href={`/admin/gemachs/new?managerPhone=${encodeURIComponent(values.phone)}`}
                className="inline-flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-medium border-2 border-primary text-primary bg-bg-surface hover:bg-primary-50 transition-colors"
              >
                <Plus className="w-4 h-4" aria-hidden />
                פתח גמח חדש למשתמש זה
              </Link>
            </div>
          )}
        </section>
      )}

      <FormField label="סטטוס" htmlFor="status" required error={errors.status?.[0]}>
        <select
          id="status"
          value={values.status}
          onChange={(e) => setField("status", e.target.value as UserStatus)}
          disabled={isSelf}
          className="w-full h-11 px-3 rounded-xl border border-primary-100 bg-bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-primary disabled:opacity-60"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {USER_STATUS[s]}
            </option>
          ))}
        </select>
      </FormField>

      <label className="flex items-start gap-2 text-sm bg-red-50/50 rounded-xl p-3">
        <input
          type="checkbox"
          checked={values.isBanned}
          onChange={(e) => setField("isBanned", e.target.checked)}
          disabled={isSelf}
          className="mt-0.5 w-4 h-4 accent-error"
        />
        <span>
          <span className="font-medium">חסום</span>
          <span className="block text-xs text-text-muted">
            משתמש חסום לא יכול לבקש השאלות חדשות. נסמן אוטומטית בהחזרה
            באיחור/נזק.
          </span>
        </span>
      </label>

      {values.isBanned && (
        <FormField
          label="סיבת חסימה"
          htmlFor="banReason"
          hint="יוצג למשתמש בעת ניסיון בקשת השאלה"
          error={errors.banReason?.[0]}
        >
          <textarea
            id="banReason"
            value={values.banReason}
            onChange={(e) => setField("banReason", e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-primary-100 bg-bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-primary"
          />
        </FormField>
      )}

      <div className="flex gap-2">
        <Button type="submit" loading={loading} size="lg">
          שמור
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.push("/admin/users")}
          disabled={loading}
        >
          ביטול
        </Button>
      </div>
    </form>
  );
}
