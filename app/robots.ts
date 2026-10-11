import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://snackdesk.shubhamspatil.me");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register", "/privacy", "/terms"],
        disallow: [
          "/admin",
          "/admin/*",
          "/super-admin",
          "/super-admin/*",
          "/api/*",
          "/dashboard",
          "/order-window",
          "/history",
          "/rankings",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
