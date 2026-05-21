import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

// GET /api/tools/[id]/qr — PNG QR code linking to the public tool page.
// Public (anyone scanning the sticker should land on the tool's page).
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const tool = await prisma.tool.findFirst({
    where: { id: params.id, isActive: true },
    select: { id: true },
  });
  if (!tool) return new Response("Not found", { status: 404 });

  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = `${origin}/catalog/${tool.id}`;
  const buffer = await QRCode.toBuffer(url, {
    width: 600,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#2C2416", light: "#FFFFFF" },
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
