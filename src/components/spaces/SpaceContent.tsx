"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PostCard } from "@/components/feed/PostCard";
import { Link } from "@/i18n/routing";
import type { Post } from "@/types/database";

interface SpaceContentProps {
  space: {
    id: string;
    slug: string;
    icon: string;
    color: string;
    members_count: number;
    posts_count: number;
  };
  name: string;
  description: string | null;
  initialIsMember: boolean;
  isLoggedIn: boolean;
  currentUserId?: string;
}

export function SpaceContent({ space, name, description, initialIsMember, isLoggedIn, currentUserId }: SpaceContentProps) {
  const t = useTranslations("spaces");
  const [isMember, setIsMember] = useState(initialIsMember);
  const [membersCount, setMembersCount] = useState(space.members_count);
  const [joining, setJoining] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/spaces/${space.slug}/posts`)
      .then((res) => res.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [space.slug]);

  const handleJoinToggle = async () => {
    if (!isLoggedIn) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/spaces/${space.slug}/join`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsMember(data.joined);
        setMembersCount((prev) => data.joined ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch {
      // fail silently
    } finally {
      setJoining(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${space.color} bg-opacity-10`}>
            {space.icon}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h1>
            {description && <p className="mt-1 text-gray-600 dark:text-gray-300">{description}</p>}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {membersCount} {t("members")} · {space.posts_count} posts
            </p>
          </div>
        </div>
        {isLoggedIn && (
          <button
            onClick={handleJoinToggle}
            disabled={joining}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              isMember
                ? "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                : "bg-primary-600 text-white hover:bg-primary-700"
            }`}
          >
            {joining ? "..." : isMember ? t("leave") : t("join")}
          </button>
        )}
      </div>

      {/* Back link */}
      <Link href="/spaces" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
        &larr; {t("allSpaces")}
      </Link>

      {/* Posts */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
          ))
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("noPosts")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
