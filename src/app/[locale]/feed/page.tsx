import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getPosts } from "@/lib/queries/posts";
import { getPostsByTag } from "@/lib/queries/tags";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { CategoryFilter } from "@/components/feed/CategoryFilter";
import { FeedToggle } from "@/components/feed/FeedToggle";
import { LanguageFilter } from "@/components/feed/LanguageFilter";
import { LoadMoreButton } from "@/components/feed/LoadMoreButton";
import { TrendingPosts } from "@/components/feed/TrendingPosts";
import { PopularTags } from "@/components/feed/PopularTags";
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
  searchParams: Promise<{ category?: string; page?: string; lang?: string; feed?: string; tag?: string }>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "feed" });
  const lang = search.lang;
  const feedType = search.feed || "all";

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
  const followingOnly = feedType === "following";
  const tagSlug = search.tag;

  let postsData = { posts: [] as Awaited<ReturnType<typeof getPosts>>["posts"], total: 0 };
  try {
    if (tagSlug) {
      // Filter by tag
      const tagResult = await getPostsByTag({ tagSlug, page, limit: 20, userId });
      postsData = { posts: tagResult.posts, total: tagResult.total };
    } else {
      postsData = await getPosts({ page, category, locale: lang, userId, followingOnly, followerId: followingOnly ? userId : undefined });
    }
  } catch {
    // fail gracefully
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Container>
        <div className="flex flex-col gap-6 py-4 lg:flex-row">
          {/* Main column: Feed */}
          <main className="min-w-0 flex-1">
            <div className="overflow-hidden bg-white shadow sm:rounded-xl dark:bg-gray-900">
              {/* Composer */}
              <PostComposer locale={locale} isLoggedIn={!!user} />

              {/* Feed Toggle */}
              <Suspense fallback={null}>
                <FeedToggle />
              </Suspense>

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
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{t("empty.title")}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {category ? t("empty.filtered") : t("empty.description")}
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* Sidebar */}
          <aside className="w-full space-y-6 lg:w-80 lg:flex-shrink-0">
            <Suspense fallback={null}>
              <PopularTags />
            </Suspense>
            <TrendingPosts />
          </aside>
        </div>
      </Container>
    </div>
  );
}
