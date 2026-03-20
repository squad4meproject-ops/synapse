"use client";

import { useState } from "react";
import { PostCard } from "./PostCard";
import type { Post } from "@/types/database";

export function LoadMoreButton({
  initialPage,
  total,
  limit,
  category,
  isLoggedIn,
  currentUserId,
}: {
  initialPage: number;
  total: number;
  limit: number;
  category?: string;
  isLoggedIn: boolean;
  currentUserId?: string;
}) {
  const [additionalPosts, setAdditionalPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);

  const hasMore = page * limit < total;

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: limit.toString(),
      });
      if (category) params.set('category', category);

      const res = await fetch(`/api/posts/feed?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAdditionalPosts(prev => [...prev, ...data.posts]);
        setPage(nextPage);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Additional posts loaded via "Load more" */}
      {additionalPosts.map((post) => (
        <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
      ))}

      {/* Load more button */}
      {hasMore && (
        <div className="pt-2 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more posts"}
          </button>
        </div>
      )}
    </>
  );
}
