import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getTools, getToolCategories } from "@/lib/queries/tools";
import { Container } from "@/components/ui/Container";
import { ToolCard } from "@/components/tools/ToolCard";
import { ToolFilter } from "@/components/tools/ToolFilter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return generatePageMetadata({
    title: t("toolsTitle"),
    description: t("toolsDescription"),
    locale,
    path: "/tools",
  });
}

export default async function ToolsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { category } = await searchParams;
  const t = await getTranslations({ locale, namespace: "tools" });

  let tools: Awaited<ReturnType<typeof getTools>> = [];
  let categories: string[] = [];

  try {
    [tools, categories] = await Promise.all([
      getTools(locale, category),
      getToolCategories(),
    ]);
  } catch {
    // Supabase not configured yet
  }

  return (
    <Container className="py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-gray-100">
          {t("title")}
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{t("description")}</p>
      </div>

      {categories.length > 0 && (
        <div className="mb-8">
          <Suspense>
            <ToolFilter categories={categories} />
          </Suspense>
        </div>
      )}

      {tools.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} translations={(key: string) => t(key)} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">{t("noTools")}</p>
      )}
    </Container>
  );
}
