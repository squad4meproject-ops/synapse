import { getTranslations } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getArticles } from "@/lib/queries/articles";
import { getFeaturedTools } from "@/lib/queries/tools";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedTools } from "@/components/home/FeaturedTools";
import { LatestArticles } from "@/components/home/LatestArticles";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return generatePageMetadata({
    title: t("homeTitle"),
    description: t("homeDescription"),
    locale,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  let tools: Awaited<ReturnType<typeof getFeaturedTools>> = [];

  try {
    [articles, tools] = await Promise.all([
      getArticles(locale),
      getFeaturedTools(),
    ]);
  } catch {
    // Supabase not configured yet — render page without data
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Synapse",
          url: SITE_URL,
          description:
            "The global AI community platform for tools, articles, and collaboration.",
        }}
      />
      <HeroSection />
      <FeaturedTools tools={tools} />
      <LatestArticles articles={articles} locale={locale} />
    </>
  );
}
