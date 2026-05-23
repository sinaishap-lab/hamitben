"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { ImageUploader } from "@/components/tools/ImageUploader";

type Values = {
  name: string;
  description: string;
  categoryId: string;
  images: string[];
  autoApprove: boolean;
  depositAmount: number;
  dailyRate: number;
  maxDays: number;
};

type FieldErrors = Partial<Record<keyof Values, string[]>>;

export function ToolForm({
  gemachId,
  toolId,
  initial,
  categories,
  redirectAfter,
  cloudinaryConfigured,
}: {
  gemachId: string;
  toolId?: string;
  initial: Values;
  categories: { id: string; name: string }[];
  redirectAfter: string;
  cloudinaryConfigured: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
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

    const payload = toolId ? values : { ...values, gemachId };
    const url = toolId ? `/api/tools/${toolId}` : "/api/tools";
    const method = toolId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(redirectAfter);
        router.refresh();
        return;
      }
      if (data.error === "VALIDATION") {
        setErrors(data.issues as FieldErrors);
      } else {
        setServerError("שמירה נכשלה");
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

      <FormField label="שם הכלי" htmlFor="name" required error={errors.name?.[0]}>
        <Input
          id="name"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          invalid={!!errors.name}
          required
        />
      </FormField>

      <FormField label="תיאור" htmlFor="description" error={errors.description?.[0]}>
        <textarea
          id="description"
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-primary-100 bg-bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
      </FormField>

      <FormField
        label="קטגוריה"
        htmlFor="categoryId"
        required
        error={errors.categoryId?.[0]}
      >
        <select
          id="categoryId"
          value={values.categoryId}
          onChange={(e) => setField("categoryId", e.target.value)}
          className="w-full h-11 px-3 rounded-xl border border-primary-100 bg-bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        >
          <option value="" disabled>
            — בחר קטגוריה —
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="תמונות" htmlFor="images" error={errors.images?.[0]}>
        <ImageUploader
          value={values.images}
          onChange={(arr) => setField("images", arr)}
          folder={`hamitben/tools/${gemachId}`}
          cloudinaryConfigured={cloudinaryConfigured}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="פיקדון (₪)"
          htmlFor="depositAmount"
          error={errors.depositAmount?.[0]}
        >
          <Input
            id="depositAmount"
            type="number"
            min={0}
            step={10}
            dir="ltr"
            value={values.depositAmount}
            onChange={(e) =>
              setField("depositAmount", parseFloat(e.target.value) || 0)
            }
          />
        </FormField>
        <FormField
          label="תעריף יומי (₪)"
          htmlFor="dailyRate"
          error={errors.dailyRate?.[0]}
        >
          <Input
            id="dailyRate"
            type="number"
            min={0}
            step={5}
            dir="ltr"
            value={values.dailyRate}
            onChange={(e) =>
              setField("dailyRate", parseFloat(e.target.value) || 0)
            }
          />
        </FormField>
      </div>

      <FormField
        label="ימים מקסימליים להשאלה"
        htmlFor="maxDays"
        hint="מספר ימים מקסימלי להשאלה אחת"
        error={errors.maxDays?.[0]}
      >
        <Input
          id="maxDays"
          type="number"
          min={1}
          max={365}
          step={1}
          dir="ltr"
          value={values.maxDays}
          onChange={(e) => setField("maxDays", parseInt(e.target.value) || 1)}
        />
      </FormField>

      <label className="flex items-start gap-2 text-sm bg-primary-50/50 rounded-xl p-3">
        <input
          type="checkbox"
          checked={values.autoApprove}
          onChange={(e) => setField("autoApprove", e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-primary"
        />
        <span>
          <span className="font-medium">אישור אוטומטי</span>
          <span className="block text-xs text-text-muted">
            לאחר נעילת פיקדון הבקשה תאושר ללא התערבות מנהל
          </span>
        </span>
      </label>

      <Button type="submit" loading={loading} size="lg">
        {toolId ? "שמור" : "צור כלי"}
      </Button>
    </form>
  );
}
