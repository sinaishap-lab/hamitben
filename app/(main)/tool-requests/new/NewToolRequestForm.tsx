"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";

type FieldErrors = Partial<
  Record<"description" | "categoryId" | "gemachId", string[]>
>;

export function NewToolRequestForm({
  gemachs,
  categories,
}: {
  gemachs: { id: string; name: string }[];
  categories: { id: string; name: string }[];
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
      categoryId: form.get("categoryId") || null,
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

      <FormField
        label="קטגוריה (אופציונלי)"
        htmlFor="categoryId"
        error={errors.categoryId?.[0]}
      >
        <select
          id="categoryId"
          name="categoryId"
          defaultValue=""
          className="w-full h-11 px-3 rounded-xl border border-primary-100 bg-bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        >
          <option value="">— לא ידוע —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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
