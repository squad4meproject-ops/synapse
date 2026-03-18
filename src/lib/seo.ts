import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, LOCALES } from "./constants";

export function generatePageMetadata({
  title,
  description,
  locale,
  path = "",
}: {
  title: string;
  description: string;
  locale: string;
  path?: string;
}): Metadata {
  const url = `${SITE_URL}/${locale}${path}`;

  const languages: Record<string, string> = {};
  for (const loc of LOCALES) {
    languages[loc] = `${SITE_URL}/${loc}${path}`;
  }
  languages["x-default"] = `${SITE_URL}/en${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
