"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";

type FieldErrors = Partial<
  Record<"name" | "address" | "phone" | "managerPhone" | "description", string[]>
>;

export function NewGemachForm({
  prefilledManagerPhone = "",
}: {
  prefilledManagerPhone?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setServerError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      description: form.get("description") || null,
      address: form.get("address"),
      phone: form.get("phone") || null,
      managerPhone: form.get("managerPhone"),
    };

    try {
      const res = await fetch("/api/gemachs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        router.push("/admin/gemachs");
        return;
      }
      if (data.error === "VALIDATION") {
        setErrors(data.issues as FieldErrors);
      } else if (
        data.error === "MANAGER_NOT_FOUND" ||
        data.error === "MANAGER_NOT_APPROVED" ||
        data.error === "MANAGER_HAS_GEMACH"
      ) {
        setErrors({ managerPhone: [data.message] });
      } else if (data.error === "DUPLICATE") {
        setErrors({ [data.field]: [data.message] } as FieldErrors);
      } else {
        setServerError("יצירה נכשלה");
      }
    } catch {
      setServerError("בעיית רשת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <FormField label="שם הגמח" htmlFor="name" required error={errors.name?.[0]}>
        <Input id="name" name="name" required invalid={!!errors.name} />
      </FormField>

      <FormField label="תיאור" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-xl border border-primary-100 bg-bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
      </FormField>

      <FormField label="כתובת" htmlFor="address" required error={errors.address?.[0]}>
        <Input id="address" name="address" required invalid={!!errors.address} />
      </FormField>

      <FormField
        label="טלפון ליצירת קשר"
        htmlFor="phone"
        hint="פורמט: 05XXXXXXXX"
        error={errors.phone?.[0]}
      >
        <Input id="phone" name="phone" type="tel" dir="ltr" invalid={!!errors.phone} />
      </FormField>

      <FormField
        label="טלפון המנהל"
        htmlFor="managerPhone"
        required
        hint="משתמש קיים ומאושר; יוגדר כמנהל גמח"
        error={errors.managerPhone?.[0]}
      >
        <Input
          id="managerPhone"
          name="managerPhone"
          type="tel"
          dir="ltr"
          required
          defaultValue={prefilledManagerPhone}
          invalid={!!errors.managerPhone}
        />
      </FormField>

      <Button type="submit" loading={loading} size="lg">
        צור גמח
      </Button>
    </form>
  );
}
