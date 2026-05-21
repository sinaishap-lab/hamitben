"use client";

import { useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";

type Props = {
  userId: string;
  initial: { name: string; email: string };
  phone: string;
};

type FieldErrors = Partial<Record<"name" | "email", string[]>>;

export function ProfileEditForm({ userId, initial, phone }: Props) {
  const { update } = useSession();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverMsg, setServerMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [values, setValues] = useState(initial);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (res.ok) {
        setServerMsg({ type: "success", text: "הפרטים עודכנו" });
        setEditing(false);
        await update({ refresh: true });
      } else if (data.error === "VALIDATION") {
        setErrors(data.issues as FieldErrors);
      } else if (data.error === "DUPLICATE") {
        setErrors({ email: [data.message] });
      } else {
        setServerMsg({ type: "error", text: "עדכון נכשל" });
      }
    } catch {
      setServerMsg({ type: "error", text: "בעיית רשת" });
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        {serverMsg && (
          <Alert variant={serverMsg.type === "success" ? "success" : "error"}>
            {serverMsg.text}
          </Alert>
        )}
        <Row label="שם מלא" value={values.name} />
        <Row label="אימייל" value={values.email} ltr />
        <Row label="טלפון" value={phone} ltr />
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditing(true)}
          className="mt-2 w-auto self-start"
        >
          ערוך פרטים
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      {serverMsg && (
        <Alert variant={serverMsg.type === "success" ? "success" : "error"}>
          {serverMsg.text}
        </Alert>
      )}
      <FormField label="שם מלא" htmlFor="name" required error={errors.name?.[0]}>
        <Input
          id="name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          invalid={!!errors.name}
          required
        />
      </FormField>
      <FormField label="אימייל" htmlFor="email" required error={errors.email?.[0]}>
        <Input
          id="email"
          type="email"
          dir="ltr"
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          invalid={!!errors.email}
          required
        />
      </FormField>
      <p className="text-xs text-text-muted">טלפון אינו ניתן לעריכה.</p>
      <div className="flex gap-2">
        <Button type="submit" loading={loading} size="md">
          שמור
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => {
            setEditing(false);
            setValues(initial);
            setErrors({});
          }}
        >
          ביטול
        </Button>
      </div>
    </form>
  );
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-primary-50 py-1.5 last:border-0">
      <span className="text-text-muted">{label}</span>
      <span className={ltr ? "font-mono text-sm" : ""} dir={ltr ? "ltr" : undefined}>
        {value}
      </span>
    </div>
  );
}
