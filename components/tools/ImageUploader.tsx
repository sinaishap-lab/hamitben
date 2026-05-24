"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, Camera, X, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

const MAX_IMAGES = 5;
const MAX_DIM = 1600; // px — plenty for catalog thumbnails + retina
const JPEG_QUALITY = 0.85;

/**
 * Downscale + re-encode an image in the browser before upload.
 * A 12MP phone photo becomes a ~300KB JPEG — well under the server limit
 * and far quicker to upload. Falls back to the original on any failure
 * (e.g. an undecodable format).
 */
async function downscaleImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > MAX_DIM || height > MAX_DIM) {
      const scale = Math.min(MAX_DIM / width, MAX_DIM / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    // Use whichever is smaller — never grow a file by re-encoding.
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export function ImageUploader({
  value,
  onChange,
  folder,
  cloudinaryConfigured,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  folder: string;
  cloudinaryConfigured: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  // If Cloudinary isn't configured we start in URL-paste mode immediately —
  // no need for the user to discover this via a failed upload.
  const [fallbackMode, setFallbackMode] = useState(!cloudinaryConfigured);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      // Shrink large photos client-side so they fit the server limit.
      const optimized = await downscaleImage(file);

      const fd = new FormData();
      fd.append("file", optimized, "image.jpg");
      fd.append("folder", folder);

      // Server proxies the file to Cloudinary — no client-side signing.
      const res = await fetch("/api/upload", { method: "POST", body: fd });

      if (res.status === 503) {
        setFallbackMode(true);
        setError("העלאה לענן לא מוגדרת. הדבק כתובת תמונה ישירה במקום.");
        return;
      }

      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        message?: string;
      };

      if (!res.ok || !data.url) {
        setError(data.message ?? "העלאת התמונה נכשלה");
        return;
      }
      onChange([...value, data.url]);
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

      {!cloudinaryConfigured && (
        <p className="text-xs text-text-muted bg-primary-50/50 rounded-lg px-2 py-1.5">
          העלאה לענן לא מוגדרת. הדבק כתובת URL של תמונה (Imgur, Drive ציבורי, וכו&apos;).
        </p>
      )}

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
        <div className="grid grid-cols-2 gap-2">
          {/* Take a photo — on mobile capture="environment" opens the back
              camera directly; on desktop it falls back to the file picker. */}
          <label className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-primary-200 text-primary cursor-pointer hover:bg-primary-50 transition-colors">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
            ) : (
              <Camera className="w-5 h-5" aria-hidden />
            )}
            <span className="text-sm">
              {uploading ? "מעלה..." : "צלם תמונה"}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </label>

          {/* Pick from the gallery / file system. */}
          <label className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-primary-200 text-primary cursor-pointer hover:bg-primary-50 transition-colors">
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
        </div>
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addManualUrl();
              }
            }}
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
