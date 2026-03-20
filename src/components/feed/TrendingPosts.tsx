"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface TrendingPost {
  id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  score: number;
  author: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export function TrendingPosts() {
  const t = useTranslations("feed");
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts/trending")
      .then(res => res.json())
      .then(data => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-gray-700 dark:bg-gray-900">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-xs dark:bg-orange-900/30">🔥</span>
          {t("trending.title")}
        </h3>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-gray-700 dark:bg-gray-900">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-xs dark:bg-orange-900/30">🔥</span>
          {t("trending.title")}
        </h3>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{t("trending.noTrending")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover dark:border-gray-700 dark:bg-gray-900">
      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-xs dark:bg-orange-900/30">🔥</span>
        {t("trending.title")}
      </h3>
      <div className="mt-4 space-y-1">
        {posts.map((post, index) => {
          const authorName = post.author?.display_name || post.author?.username || "Anonymous";
          const preview = post.content.slice(0, 60) + (post.content.length > 60 ? "..." : "");

          return (
            <div
              key={post.id}
              className="flex items-start gap-3 rounded-xl p-2.5 transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 line-clamp-2 dark:text-gray-100">{preview}</p>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-400">
                  <span>{authorName}</span>
                  <span>❤️ {post.likes_count}</span>
                  <span>💬 {post.comments_count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
