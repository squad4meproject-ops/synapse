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
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-accent-100 text-xs">📰</span>
          {t("latestArticles")}
        </h3>
        <Link
          href="/articles"
          className="text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          {t("viewAllArticles")} →
        </Link>
      </div>
      <div className="mt-4 space-y-1">
        {articles.slice(0, 5).map((article) => {
          const title = article.article_translations?.[0]?.title || article.slug;

          return (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="block rounded-xl p-2.5 transition-all hover:bg-accent-50/50"
            >
              <p className="text-sm font-medium text-gray-900 line-clamp-2 dark:text-gray-100">{title}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {new Date(article.published_at || article.created_at).toLocaleDateString(locale)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
