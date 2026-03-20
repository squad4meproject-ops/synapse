import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getUserByUsername, getUserPosts, getUserStats, getUserLikedPosts } from "@/lib/queries/users";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PostCard } from "@/components/feed/PostCard";
import { MessageButton } from "@/components/feed/MessageButton";
import { Link } from "@/i18n/routing";
import type { Post } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  const user = await getUserByUsername(username);

  if (!user) return {};

  return generatePageMetadata({
    title: `${user.display_name || username} — Synapse`,
    description: user.bio || `${user.display_name || username}'s profile on Synapse`,
    locale,
    path: `/user/${username}`,
  });
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, username } = await params;
  const search = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "profile" });

  const user = await getUserByUsername(username);
  if (!user) notFound();

  // Check if viewer is logged in
  const supabase = await createClient();
  const { data: { user: viewer } } = await supabase.auth.getUser();

  let viewerId: string | undefined;
  if (viewer) {
    const { data: viewerData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", viewer.id)
      .single() as { data: { id: string } | null };
    viewerId = viewerData?.id;
  }

  const activeTab = search.tab || "posts";

  // Fetch data based on active tab
  const [stats, postsData, likedData] = await Promise.all([
    getUserStats(user.id),
    activeTab === "posts" ? getUserPosts(user.id) : Promise.resolve({ posts: [], total: 0 }),
    activeTab === "likes" ? getUserLikedPosts(user.id) : Promise.resolve({ posts: [], total: 0 }),
  ]);

  const displayPosts = activeTab === "posts" ? postsData.posts : likedData.posts;

  const initial = (user.display_name || username).charAt(0).toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="max-w-2xl py-6">
        {/* Back link */}
        <Link
          href="/feed"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          &larr; {t("backToFeed")}
        </Link>

        {/* Profile header */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          {/* Banner */}
          {user.banner_url ? (
            <img src={user.banner_url} alt="" className="h-48 w-full object-cover" />
          ) : (
            <div className="h-48 w-full bg-gradient-to-r from-primary-500 to-accent-500" />
          )}

          <div className="relative px-6 pb-6">
            {/* Avatar overlapping banner */}
            <div className="-mt-12 mb-3">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name || username}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary-500 to-accent-500 text-3xl font-bold text-white shadow-md">
                  {initial}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {user.display_name || username}
                </h1>
                {user.is_premium && (
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">
                    Premium
                  </span>
                )}
              </div>
              {user.username && (
                <p className="text-sm text-gray-500">@{user.username}</p>
              )}
              {user.bio && (
                <p className="mt-2 text-sm text-gray-700">{user.bio}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                <span>{t("memberSince", { date: memberSince })}</span>
              </div>
              {user.email && (
                <p className="mt-1 text-xs text-gray-500">{user.email}</p>
              )}

              {/* Social links */}
              {user.social_links && user.social_links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {user.social_links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}

              {/* Message button */}
              {viewer && viewerId !== user.id && (
                <MessageButton targetUserId={user.id} />
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.postsCount}</p>
            <p className="text-xs text-gray-500">{t("posts")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.commentsCount}</p>
            <p className="text-xs text-gray-500">{t("commentsCount")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{stats.likesReceived}</p>
            <p className="text-xs text-gray-500">{t("likesReceived")}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 border-b border-gray-200">
          <Link
            href={`/user/${username}?tab=posts`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "posts"
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("posts")}
          </Link>
          <Link
            href={`/user/${username}?tab=likes`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "likes"
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t("likesReceived")}
          </Link>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {displayPosts.length > 0 ? (
            displayPosts.map((post: Post) => (
              <PostCard
                key={post.id}
                post={post as Post}
                isLoggedIn={!!viewer}
                currentUserId={viewerId}
              />
            ))
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">
                {activeTab === "posts" ? t("noPosts") : t("noPosts")}
              </p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
