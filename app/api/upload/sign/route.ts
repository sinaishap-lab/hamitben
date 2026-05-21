import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/api-helpers";
import { isCloudinaryConfigured, signUpload } from "@/lib/cloudinary";

const signSchema = z.object({
  folder: z
    .string()
    .regex(/^hamitben\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/, "תיקיה לא חוקית"),
});

// POST /api/upload/sign — returns a short-lived Cloudinary upload signature.
// Restricted to gemach managers and admins (the only users who upload tool images).
export async function POST(req: Request) {
  const r = await requireRole("GEMACH_MANAGER", "ADMIN");
  if ("error" in r) return r.error;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        error: "NOT_CONFIGURED",
        message:
          "Cloudinary לא מוגדר. הגדר CLOUDINARY_* ב-.env.local או הדבק URL ישיר.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = signSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const sig = signUpload(parsed.data.folder);
    return NextResponse.json(sig);
  } catch (err) {
    console.error("[upload.sign] failed", err);
    return NextResponse.json({ error: "SERVER" }, { status: 500 });
  }
}
