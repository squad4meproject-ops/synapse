import type { MetadataRoute } from "next";
import { SITE_URL, LOCALES } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ["", "/articles", "/tools", "/about"];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "daily" : "weekly",
        priority: page === "" ? 1 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((loc) => [loc, `${SITE_URL}/${loc}${page}`])
          ),
        },
      });
    }
  }

  return entries;
}
