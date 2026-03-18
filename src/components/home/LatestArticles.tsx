import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { ArticleCard } from "@/components/articles/ArticleCard";
import type { ArticleWithTranslation } from "@/types";

export function LatestArticles({
  articles,
  locale,
}: {
  articles: ArticleWithTranslation[];
  locale: string;
}) {
  const t = useTranslations("home");

  if (!articles.length) return null;

  return (
    <section className="bg-gray-50 py-16">
      <Container>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t("latestArticles")}
          </h2>
          <Link
            href="/articles"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {t("viewAllArticles")} &rarr;
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 6).map((article) => (
            <ArticleCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
      </Container>
    </section>
  );
}
