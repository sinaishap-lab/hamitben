"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";

type Initial = {
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  imageUrl: string | null;
};

type FieldErrors = Partial<
  Record<"name" | "address" | "phone" | "description" | "lat" | "lng" | "imageUrl", string[]>
>;

export function GemachEditForm({
  gemachId,
  initial,
  redirectAfter,
}: {
  gemachId: string;
  initial: Initial;
  redirectAfter?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [values, setValues] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function setField<K extends keyof Initial>(key: K, val: Initial[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setMsg(null);

    try {
      const res = await fetch(`/api/gemachs/${gemachId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "נשמר" });
        startTransition(() => {
          if (redirectAfter) router.push(redirectAfter);
          else router.refresh();
        });
      } else if (data.error === "VALIDATION") {
        setErrors(data.issues as FieldErrors);
      } else if (data.error === "DUPLICATE") {
        setErrors({ [data.field]: [data.message] } as FieldErrors);
      } else {
        setMsg({ type: "error", text: "שמירה נכשלה" });
      }
    } catch {
      setMsg({ type: "error", text: "בעיית רשת" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {msg && (
        <Alert variant={msg.type === "success" ? "success" : "error"}>{msg.text}</Alert>
      )}

      <FormField label="שם הגמח" htmlFor="name" required error={errors.name?.[0]}>
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
          value={values.description ?? ""}
          onChange={(e) => setField("description", e.target.value || null)}
          rows={3}
          className="w-full rounded-xl border border-primary-100 bg-bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
      </FormField>

      <FormField label="כתובת" htmlFor="address" required error={errors.address?.[0]}>
        <Input
          id="address"
          value={values.address}
          onChange={(e) => setField("address", e.target.value)}
          invalid={!!errors.address}
          required
        />
      </FormField>

      <FormField
        label="טלפון יצירת קשר"
        htmlFor="phone"
        hint="פורמט: 05XXXXXXXX"
        error={errors.phone?.[0]}
      >
        <Input
          id="phone"
          type="tel"
          dir="ltr"
          value={values.phone ?? ""}
          onChange={(e) => setField("phone", e.target.value || null)}
          invalid={!!errors.phone}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="קו רוחב (lat)" htmlFor="lat" error={errors.lat?.[0]}>
          <Input
            id="lat"
            type="number"
            step="0.0001"
            dir="ltr"
            value={values.lat ?? ""}
            onChange={(e) =>
              setField("lat", e.target.value === "" ? null : parseFloat(e.target.value))
            }
          />
        </FormField>
        <FormField label="קו אורך (lng)" htmlFor="lng" error={errors.lng?.[0]}>
          <Input
            id="lng"
            type="number"
            step="0.0001"
            dir="ltr"
            value={values.lng ?? ""}
            onChange={(e) =>
              setField("lng", e.target.value === "" ? null : parseFloat(e.target.value))
            }
          />
        </FormField>
      </div>

      <Button type="submit" loading={loading} size="lg">
        שמור
      </Button>
    </form>
  );
}
