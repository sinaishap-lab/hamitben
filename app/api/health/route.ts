import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health
 *
 * Lightweight health probe for uptime monitors.
 *   - `?deep=1` pings the DB; otherwise it's a static "I'm alive".
 *
 * Always returns JSON. Status code reflects health.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const deep = url.searchParams.get("deep") === "1";

  if (!deep) {
    return NextResponse.json(
      {
        ok: true,
        ts: new Date().toISOString(),
        env: process.env.NODE_ENV,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        ok: true,
        ts: new Date().toISOString(),
        db: "ok",
        env: process.env.NODE_ENV,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        ts: new Date().toISOString(),
        db: "error",
        message: (err as Error).message,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
