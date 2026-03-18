import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getArticleBySlug, getArticleSlugs } from "@/lib/queries/articles";
import { Container } from "@/components/ui/Container";
import { ArticleContent } from "@/components/articles/ArticleContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatDate } from "@/lib/utils";
import { SITE_URL, LOCALES } from "@/lib/constants";
import { Link } from "@/i18n/routing";
import type { ArticleWithTranslation } from "@/types";

export async function generateStaticParams() {
  try {
    const slugs = await getArticleSlugs();
    return LOCALES.flatMap((locale) =>
      slugs.map((slug) => ({ locale, slug }))
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(slug, locale).catch(() => null);

  if (!article) {
    return {};
  }

  const translation = article.article_translations[0];

  return generatePageMetadata({
    title: translation?.meta_title || translation?.title || slug,
    description: translation?.meta_description || translation?.excerpt || "",
    locale,
    path: `/articles/${slug}`,
  });
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "articles" });

  let article: ArticleWithTranslation | null = null;
  try {
    article = await getArticleBySlug(slug, locale);
  } catch {
    notFound();
  }

  if (!article) notFound();

  const translation = article.article_translations[0];
  if (!translation) notFound();

  return (
    <Container className="py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: translation.title,
          description: translation.excerpt,
          datePublished: article.published_at,
          author: article.users?.display_name
            ? { "@type": "Person", name: article.users.display_name }
            : undefined,
          url: `${SITE_URL}/${locale}/articles/${slug}`,
        }}
      />

      <Link
        href="/articles"
        className="text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        &larr; {t("backToArticles")}
      </Link>

      <article className="mt-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            {translation.title}
          </h1>
          {translation.excerpt && (
            <p className="mt-4 text-xl text-gray-600">{translation.excerpt}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            {article.published_at && (
              <span>
                {t("publishedOn")} {formatDate(article.published_at, locale)}
              </span>
            )}
            {article.users?.display_name && (
              <span>
                {t("by")} {article.users.display_name}
              </span>
            )}
          </div>
        </header>

        {article.cover_image_url && (
          <div className="mb-10 aspect-video overflow-hidden rounded-xl">
            <img
              src={article.cover_image_url}
              alt={translation.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <ArticleContent content={translation.content} />
      </article>
    </Container>
  );
}
