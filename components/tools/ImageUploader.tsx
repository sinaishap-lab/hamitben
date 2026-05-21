"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

const MAX_IMAGES = 5;

type SignResponse = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
};

export function ImageUploader({
  value,
  onChange,
  folder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  folder: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [fallbackMode, setFallbackMode] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });
      if (signRes.status === 503) {
        setFallbackMode(true);
        setError(
          "העלאה לענן לא מוגדרת. הדבק כתובת תמונה ישירה במקום."
        );
        return;
      }
      if (!signRes.ok) {
        setError("חתימת ההעלאה נכשלה");
        return;
      }
      const sig = (await signRes.json()) as SignResponse;

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", sig.apiKey);
      fd.append("timestamp", String(sig.timestamp));
      fd.append("folder", sig.folder);
      fd.append("signature", sig.signature);

      const upRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: "POST", body: fd }
      );
      if (!upRes.ok) {
        setError("העלאה לענן נכשלה");
        return;
      }
      const data = (await upRes.json()) as { secure_url: string };
      onChange([...value, data.secure_url]);
    } catch {
      setError("שגיאת רשת בעת ההעלאה");
    } finally {
      setUploading(false);
    }
  }

  function addManualUrl() {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed); // validates
    } catch {
      setError("כתובת לא תקינה");
      return;
    }
    setError(null);
    onChange([...value, trimmed]);
    setManualUrl("");
  }

  function removeAt(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  const canAdd = value.length < MAX_IMAGES;

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert variant={fallbackMode ? "warning" : "error"}>{error}</Alert>}

      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="relative aspect-square rounded-xl overflow-hidden border border-primary-100 bg-bg"
            >
              <Image
                src={url}
                alt={`תמונה ${i + 1}`}
                fill
                sizes="(max-width:480px) 33vw, 160px"
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 left-1 bg-error/90 text-white rounded-full w-6 h-6 flex items-center justify-center"
                aria-label="הסר תמונה"
              >
                <X className="w-3.5 h-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {canAdd && !fallbackMode && (
        <label
          className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-primary-200 text-primary cursor-pointer hover:bg-primary-50"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
          ) : (
            <Upload className="w-5 h-5" aria-hidden />
          )}
          <span className="text-sm">
            {uploading ? "מעלה..." : "העלה תמונה"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </label>
      )}

      {canAdd && fallbackMode && (
        <div className="flex gap-2">
          <Input
            type="url"
            dir="ltr"
            placeholder="https://..."
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            size="md"
            variant="outline"
            className="w-auto"
            onClick={addManualUrl}
          >
            <LinkIcon className="w-4 h-4" />
            הוסף
          </Button>
        </div>
      )}

      <p className="text-xs text-text-muted">
        עד {MAX_IMAGES} תמונות. {value.length}/{MAX_IMAGES} נבחרו.
      </p>
    </div>
  );
}
