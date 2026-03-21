import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { formatDate, truncateText } from "@/lib/utils";
import type { ArticleWithTranslation } from "@/types";

export function ArticleCard({
  article,
  locale,
}: {
  article: ArticleWithTranslation;
  locale: string;
}) {
  const t = useTranslations("articles");
  const translation = article.article_translations[0];

  if (!translation) return null;

  return (
    <Card className="flex flex-col">
      {article.cover_image_url && (
        <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
          <img
            src={article.cover_image_url}
            alt={translation.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Link
            href={`/articles/${article.slug}`}
            className="hover:text-primary-600"
          >
            {translation.title}
          </Link>
        </h3>
        {translation.excerpt && (
          <p className="mt-2 flex-1 text-sm text-gray-600 dark:text-gray-400">
            {truncateText(translation.excerpt, 150)}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {article.published_at && (
              <>
                {t("publishedOn")} {formatDate(article.published_at, locale)}
              </>
            )}
          </span>
          {article.users?.display_name && (
            <span>
              {t("by")} {article.users.display_name}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
