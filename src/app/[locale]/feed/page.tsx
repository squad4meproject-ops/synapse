import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getPosts } from "@/lib/queries/posts";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { CategoryFilter } from "@/components/feed/CategoryFilter";
import { LanguageFilter } from "@/components/feed/LanguageFilter";
import { LoadMoreButton } from "@/components/feed/LoadMoreButton";
import type { PostCategory } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feed" });

  return generatePageMetadata({
    title: t("title"),
    description: "Community feed — share AI creations, prompts, and discussions.",
    locale,
    path: "/feed",
  });
}

export default async function FeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; page?: string; lang?: string }>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "feed" });
  const lang = search.lang;

  // Check if user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userId: string | undefined;
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single() as { data: { id: string } | null };
    userId = userData?.id;
  }

  const category = search.category as PostCategory | undefined;
  const page = parseInt(search.page || "1", 10);

  let postsData = { posts: [] as Awaited<ReturnType<typeof getPosts>>["posts"], total: 0 };
  try {
    postsData = await getPosts({ page, category, locale: lang, userId });
  } catch {
    // fail gracefully
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Container className="max-w-2xl py-0 sm:py-4">
        <div className="overflow-hidden bg-white shadow sm:rounded-xl dark:bg-gray-900">
          {/* Composer */}
          <PostComposer locale={locale} isLoggedIn={!!user} />

          {/* Category Filter */}
          <Suspense fallback={null}>
            <CategoryFilter />
          </Suspense>

          {/* Language Filter */}
          <Suspense fallback={null}>
            <LanguageFilter />
          </Suspense>

          {/* Posts Feed */}
          {postsData.posts.length > 0 ? (
            <div className="space-y-4 p-4">
              {postsData.posts.map((post) => (
                <PostCard key={post.id} post={post} isLoggedIn={!!user} currentUserId={userId} />
              ))}
              <LoadMoreButton
                initialPage={page}
                total={postsData.total}
                limit={20}
                category={category}
                lang={lang}
                isLoggedIn={!!user}
                currentUserId={userId}
              />
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-medium text-gray-900">{t("empty.title")}</p>
              <p className="mt-1 text-sm text-gray-500">
                {category ? t("empty.filtered") : t("empty.description")}
              </p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
