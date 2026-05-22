import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-helpers";
import { isCloudinaryConfigured, uploadImage } from "@/lib/cloudinary";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const FOLDER_RE = /^hamitben\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/i;

/**
 * POST /api/upload — multipart form-data: { file, folder }.
 * The server streams the file to Cloudinary and returns the hosted URL.
 * Restricted to gemach managers and admins.
 */
export async function POST(req: Request) {
  const r = await requireRole("GEMACH_MANAGER", "ADMIN");
  if ("error" in r) return r.error;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error: "NOT_CONFIGURED",
        message: "אחסון התמונות לא מוגדר. הדבק כתובת URL במקום.",
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const file = form.get("file");
  const folder = String(form.get("folder") || "");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "NO_FILE", message: "לא נבחר קובץ" },
      { status: 400 }
    );
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "NOT_IMAGE", message: "ניתן להעלות קובצי תמונה בלבד" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "TOO_LARGE", message: "התמונה גדולה מדי (מקסימום 5MB)" },
      { status: 413 }
    );
  }
  if (!FOLDER_RE.test(folder)) {
    return NextResponse.json(
      { error: "BAD_FOLDER", message: "תיקיית יעד לא חוקית" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
    const { url } = await uploadImage(dataUri, folder);
    return NextResponse.json({ ok: true, url }, { status: 201 });
  } catch (err) {
    console.error("[upload] failed", err);
    return NextResponse.json(
      { error: "UPLOAD_FAILED", message: "העלאת התמונה נכשלה" },
      { status: 502 }
    );
  }
}
