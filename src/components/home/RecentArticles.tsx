"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { ArticleWithTranslation } from "@/types";

export function RecentArticles({
  articles,
  locale,
}: {
  articles: ArticleWithTranslation[];
  locale: string;
}) {
  const t = useTranslations("home");

  if (!articles.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">{t("latestArticles")}</h3>
        <Link
          href="/articles"
          className="text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          {t("viewAllArticles")} →
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {articles.slice(0, 5).map((article) => {
          const title = article.article_translations?.[0]?.title || article.slug;

          return (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="block rounded-lg p-2 transition-colors hover:bg-gray-50"
            >
              <p className="text-sm font-medium text-gray-900 line-clamp-2">{title}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {new Date(article.published_at || article.created_at).toLocaleDateString(locale)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
