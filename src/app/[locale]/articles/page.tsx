import { getTranslations, setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getArticles } from "@/lib/queries/articles";
import { Container } from "@/components/ui/Container";
import { ArticleCard } from "@/components/articles/ArticleCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return generatePageMetadata({
    title: t("articlesTitle"),
    description: t("articlesDescription"),
    locale,
    path: "/articles",
  });
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "articles" });

  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  try {
    articles = await getArticles(locale);
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

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">{t("noArticles")}</p>
      )}
    </Container>
  );
}
