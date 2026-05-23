"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import {
  CATEGORY_ICON_KEYS,
  getCategoryIcon,
  DEFAULT_CATEGORY_ICON,
} from "@/lib/category-icons";

type Category = {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  toolCount: number;
};

type Draft = { name: string; icon: string; sortOrder: number };

type ApiCategory = {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  _count: { tools: number };
};

const EMPTY_DRAFT: Draft = {
  name: "",
  icon: DEFAULT_CATEGORY_ICON,
  sortOrder: 0,
};

export function CategoryManager({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initial);
  // null = no form open · "new" = add form · otherwise the id being edited
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  async function reload() {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) return;
      const data = (await res.json()) as { categories: ApiCategory[] };
      setCategories(
        data.categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          sortOrder: c.sortOrder,
          toolCount: c._count.tools,
        }))
      );
    } catch {
      /* keep the current list on a network hiccup */
    }
  }

  function nextSortOrder() {
    return categories.length
      ? Math.max(...categories.map((c) => c.sortOrder)) + 1
      : 1;
  }

  function startAdd() {
    setDraft({ ...EMPTY_DRAFT, sortOrder: nextSortOrder() });
    setEditing("new");
    setError(null);
    setNameError(null);
  }

  function startEdit(c: Category) {
    setDraft({ name: c.name, icon: c.icon, sortOrder: c.sortOrder });
    setEditing(c.id);
    setError(null);
    setNameError(null);
  }

  function cancel() {
    setEditing(null);
    setError(null);
    setNameError(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    setNameError(null);
    const isNew = editing === "new";
    const url = isNew ? "/api/categories" : `/api/categories/${editing}`;
    try {
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await reload();
        cancel();
        return;
      }
      if (data.error === "VALIDATION" && data.issues?.name) {
        setNameError(data.issues.name[0]);
      } else {
        setError(data.message || "שמירה נכשלה");
      }
    } catch {
      setError("בעיית רשת");
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Category) {
    if (c.toolCount > 0) {
      setError(
        `לא ניתן למחוק את "${c.name}" — ${c.toolCount} כלים משויכים אליה`
      );
      return;
    }
    if (!confirm(`למחוק את הקטגוריה "${c.name}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await reload();
        return;
      }
      setError(data.message || "מחיקה נכשלה");
    } catch {
      setError("בעיית רשת");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert variant="error">{error}</Alert>}

      {editing === null && (
        <Button size="md" onClick={startAdd} className="w-auto self-start">
          <Plus className="w-4 h-4" />
          הוסף קטגוריה
        </Button>
      )}

      {editing === "new" && (
        <CategoryFormCard
          title="קטגוריה חדשה"
          draft={draft}
          setDraft={setDraft}
          nameError={nameError}
          busy={busy}
          onSave={save}
          onCancel={cancel}
        />
      )}

      {categories.length === 0 && editing !== "new" ? (
        <p className="text-center text-text-muted py-8 text-sm">
          אין קטגוריות. הוסף את הקטגוריה הראשונה.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((c) => {
            if (editing === c.id) {
              return (
                <li key={c.id}>
                  <CategoryFormCard
                    title="עריכת קטגוריה"
                    draft={draft}
                    setDraft={setDraft}
                    nameError={nameError}
                    busy={busy}
                    onSave={save}
                    onCancel={cancel}
                  />
                </li>
              );
            }
            const Icon = getCategoryIcon(c.icon);
            return (
              <li
                key={c.id}
                className="bg-bg-surface rounded-2xl border border-primary-100 p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-text-muted">
                    {c.toolCount} כלים · סדר תצוגה {c.sortOrder}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    disabled={editing !== null}
                    aria-label={`ערוך ${c.name}`}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 disabled:opacity-40 transition-colors"
                  >
                    <Pencil className="w-4 h-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    disabled={editing !== null || busy}
                    aria-label={`מחק ${c.name}`}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-error hover:bg-error/10 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CategoryFormCard({
  title,
  draft,
  setDraft,
  nameError,
  busy,
  onSave,
  onCancel,
}: {
  title: string;
  draft: Draft;
  setDraft: (updater: (d: Draft) => Draft) => void;
  nameError: string | null;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-bg-surface rounded-2xl border border-primary-200 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-1.5 font-bold text-sm">
        <Tag className="w-4 h-4 text-primary" aria-hidden />
        {title}
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="cat-name" className="text-xs font-medium text-text-muted">
          שם הקטגוריה
        </label>
        <Input
          id="cat-name"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          invalid={!!nameError}
          autoFocus
          placeholder="לדוגמה: השקיה"
        />
        {nameError && <span className="text-xs text-error">{nameError}</span>}
      </div>

      {/* Icon picker */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-muted">אייקון</span>
        <div className="grid grid-cols-6 gap-2">
          {CATEGORY_ICON_KEYS.map((key) => {
            const Icon = getCategoryIcon(key);
            const selected = draft.icon === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, icon: key }))}
                aria-label={key}
                aria-pressed={selected}
                className={`aspect-square rounded-xl flex items-center justify-center border transition-colors ${
                  selected
                    ? "bg-primary text-text-inverse border-primary"
                    : "bg-bg text-text border-primary-100 hover:border-primary-300"
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden />
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort order */}
      <div className="flex flex-col gap-1">
        <label htmlFor="cat-order" className="text-xs font-medium text-text-muted">
          סדר תצוגה (מספר נמוך = מוקדם יותר)
        </label>
        <Input
          id="cat-order"
          type="number"
          dir="ltr"
          min={0}
          value={draft.sortOrder}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              sortOrder: parseInt(e.target.value, 10) || 0,
            }))
          }
        />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} loading={busy} className="w-auto">
          <Check className="w-4 h-4" />
          שמור
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={busy}
          className="w-auto"
        >
          <X className="w-4 h-4" />
          ביטול
        </Button>
      </div>
    </div>
  );
}
