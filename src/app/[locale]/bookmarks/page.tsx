import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getBookmarkedPosts } from "@/lib/queries/posts";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PostCard } from "@/components/feed/PostCard";
import { Link } from "@/i18n/routing";
import type { Post } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return generatePageMetadata({
    title: "Saved Posts — Synapse",
    description: "Your saved posts on Synapse",
    locale,
    path: "/bookmarks",
  });
}

export default async function BookmarksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "profile" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Trouver l'user interne
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single() as { data: { id: string } | null };

  const userId = userData?.id;
  let posts: Post[] = [];

  if (userId) {
    const result = await getBookmarkedPosts(userId);
    posts = result.posts;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="max-w-2xl py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{t("savedPosts")}</h1>
          <Link
            href="/feed"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            &larr; Back to feed
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post: Post) => (
              <PostCard
                key={post.id}
                post={post}
                isLoggedIn={true}
                currentUserId={userId}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
            <p className="mt-4 text-sm font-medium text-gray-900">{t("noSavedPosts")}</p>
            <p className="mt-1 text-sm text-gray-500">
              {t("noSavedPostsDesc")}
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
