import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://hamitben.co.il";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalog", "/gemachs", "/about", "/terms", "/donate"],
        disallow: [
          "/api/",
          "/admin/",
          "/gemach/",
          "/profile",
          "/my-loans",
          "/loans/",
          "/login",
          "/register",
          "/pending",
          "/account-blocked",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
