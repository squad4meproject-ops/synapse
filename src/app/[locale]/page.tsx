import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getArticles } from "@/lib/queries/articles";
import { getFeaturedTools } from "@/lib/queries/tools";
import { getPosts } from "@/lib/queries/posts";
import { createClient } from "@/lib/supabase/server";
import { HeroCompact } from "@/components/home/HeroCompact";
import { HomeFeed } from "@/components/home/HomeFeed";
import { TrendingTools } from "@/components/home/TrendingTools";
import { RecentArticles } from "@/components/home/RecentArticles";
import { TopContributors } from "@/components/home/TopContributors";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/constants";
import type { PostCategory } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return generatePageMetadata({
    title: t("homeTitle"),
    description: t("homeDescription"),
    locale,
  });
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  setRequestLocale(locale);

  // Check if user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userId: string | undefined;
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single() as { data: { id: string } | null };
    userId = userData?.id;
  }

  // Fetch all data in parallel
  const category = search.category as PostCategory | undefined;

  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  let tools: Awaited<ReturnType<typeof getFeaturedTools>> = [];
  let postsData = { posts: [] as Awaited<ReturnType<typeof getPosts>>["posts"], total: 0 };

  try {
    [articles, tools, postsData] = await Promise.all([
      getArticles(locale),
      getFeaturedTools(locale),
      getPosts({ page: 1, limit: 10, category, userId }),
    ]);
  } catch {
    // fail gracefully
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Synapse",
          url: SITE_URL,
          description:
            "The global AI community platform for tools, articles, and collaboration.",
        }}
      />

      {/* Compact Hero */}
      <HeroCompact />

      {/* Main content: Feed + Sidebar */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-6 sm:py-8 dark:from-gray-950 dark:to-gray-900">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Main column: Feed */}
            <main className="min-w-0 flex-1">
              <HomeFeed
                posts={postsData.posts}
                locale={locale}
                isLoggedIn={!!user}
                currentUserId={userId}
                total={postsData.total}
              />
            </main>

            {/* Sidebar */}
            <aside className="w-full space-y-6 lg:w-80 lg:flex-shrink-0">
              <TrendingTools tools={tools} />
              <RecentArticles articles={articles} locale={locale} />
              <Suspense fallback={null}>
                <TopContributors />
              </Suspense>
            </aside>
          </div>
        </Container>
      </div>
    </>
  );
}
