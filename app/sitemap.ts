import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL || "https://hamitben.co.il";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/donate`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Best-effort pull of public entities. If the DB is unreachable we still
  // return the static sitemap.
  try {
    const [tools, gemachs] = await Promise.all([
      prisma.tool.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
        take: 1000,
      }),
      prisma.gemach.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
      }),
    ]);

    const toolEntries: MetadataRoute.Sitemap = tools.map((t) => ({
      url: `${BASE_URL}/catalog/${t.id}`,
      lastModified: t.updatedAt,
      changeFrequency: "daily",
      priority: 0.7,
    }));
    const gemachEntries: MetadataRoute.Sitemap = gemachs.map((g) => ({
      url: `${BASE_URL}/gemachs/${g.id}`,
      lastModified: g.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    return [...staticRoutes, ...toolEntries, ...gemachEntries];
  } catch {
    return staticRoutes;
  }
}
