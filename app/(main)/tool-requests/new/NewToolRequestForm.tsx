"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ToolCategory } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { TOOL_CATEGORY } from "@/lib/labels";

const CATEGORIES = Object.entries(TOOL_CATEGORY) as [ToolCategory, string][];

type FieldErrors = Partial<Record<"description" | "category" | "gemachId", string[]>>;

export function NewToolRequestForm({
  gemachs,
}: {
  gemachs: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setServerError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      description: form.get("description"),
      category: form.get("category") || null,
      gemachId: form.get("gemachId") || null,
    };

    try {
      const res = await fetch("/api/tool-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        return;
      }
      if (data.error === "VALIDATION") {
        setErrors(data.issues as FieldErrors);
      } else {
        setServerError("שליחה נכשלה");
      }
    } catch {
      setServerError("בעיית רשת");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="success">
          תודה! הבקשה נשלחה. נחזור אליך כשהכלי יתווסף לגמח.
        </Alert>
        <Button variant="outline" onClick={() => router.push("/catalog")}>
          חזור לקטלוג
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <FormField
        label="תאר את הכלי"
        htmlFor="description"
        required
        hint="לדוגמה: מרסס גב 16 ליטר, חרמש בנזין..."
        error={errors.description?.[0]}
      >
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          className="w-full rounded-xl border border-primary-100 bg-bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
      </FormField>

      <FormField label="קטגוריה (אופציונלי)" htmlFor="category" error={errors.category?.[0]}>
        <select
          id="category"
          name="category"
          defaultValue=""
          className="w-full h-11 px-3 rounded-xl border border-primary-100 bg-bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        >
          <option value="">— לא ידוע —</option>
          {CATEGORIES.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="לאיזה גמח (אופציונלי)" htmlFor="gemachId" error={errors.gemachId?.[0]}>
        <select
          id="gemachId"
          name="gemachId"
          defaultValue=""
          className="w-full h-11 px-3 rounded-xl border border-primary-100 bg-bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        >
          <option value="">— כל גמח שיוסיף —</option>
          {gemachs.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </FormField>

      <Button type="submit" loading={loading} size="lg">
        שלח בקשה
      </Button>
    </form>
  );
}
