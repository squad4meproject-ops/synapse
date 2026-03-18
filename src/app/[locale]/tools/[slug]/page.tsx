import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getToolBySlug } from "@/lib/queries/tools";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { JsonLd } from "@/components/seo/JsonLd";
import { Link } from "@/i18n/routing";
import type { AiTool } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const tool = await getToolBySlug(slug).catch(() => null);

  if (!tool) return {};

  return generatePageMetadata({
    title: `${tool.name} - AI Tools | Synapse`,
    description: tool.description,
    locale,
    path: `/tools/${slug}`,
  });
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "tools" });

  let tool: AiTool | null = null;
  try {
    tool = await getToolBySlug(slug);
  } catch {
    notFound();
  }

  if (!tool) notFound();

  const pricingVariant = {
    free: "success" as const,
    freemium: "warning" as const,
    paid: "info" as const,
  };

  return (
    <Container className="py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: tool.name,
          description: tool.description,
          url: tool.website_url,
          applicationCategory: tool.category,
          offers: {
            "@type": "Offer",
            price: tool.pricing === "free" ? "0" : undefined,
          },
        }}
      />

      <Link
        href="/tools"
        className="text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        &larr; {t("backToTools")}
      </Link>

      <div className="mt-8">
        <div className="flex items-start gap-6">
          {tool.logo_url ? (
            <img
              src={tool.logo_url}
              alt={tool.name}
              className="h-20 w-20 rounded-xl object-contain"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary-100 text-3xl font-bold text-primary-600">
              {tool.name[0]}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tool.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge>{tool.category}</Badge>
              <Badge variant={pricingVariant[tool.pricing]}>
                {t(tool.pricing)}
              </Badge>
            </div>
          </div>
        </div>

        <p className="mt-8 text-lg text-gray-700">{tool.description}</p>

        <div className="mt-8">
          <a
            href={tool.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700"
          >
            {t("visitTool")} &rarr;
          </a>
        </div>
      </div>
    </Container>
  );
}
