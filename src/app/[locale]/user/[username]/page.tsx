import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getUserByUsername, getUserPosts } from "@/lib/queries/users";
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
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
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

  const { posts } = await getUserPosts(user.id);
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
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name || username}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
                {initial}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {user.display_name || username}
              </h1>
              {user.username && (
                <p className="text-sm text-gray-500">@{user.username}</p>
              )}
              {user.bio && (
                <p className="mt-2 text-sm text-gray-700">{user.bio}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span>{t("memberSince", { date: memberSince })}</span>
                <span>{posts.length} {t("posts")}</span>
              </div>
              {user.email && (
                <p className="mt-1 text-xs text-gray-500">{user.email}</p>
              )}
              {viewer && viewerId !== user.id && (
                <MessageButton targetUserId={user.id} />
              )}
            </div>
          </div>
        </div>

        {/* User's posts */}
        <div className="mt-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">{t("posts")}</h2>
          {posts.length > 0 ? (
            posts.map((post: Post) => (
              <PostCard
                key={(post as Post).id}
                post={post as Post}
                isLoggedIn={!!viewer}
              />
            ))
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">{t("noPosts")}</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
