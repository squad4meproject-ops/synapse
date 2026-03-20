"use client";

import { Suspense } from "react";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { CategoryFilter } from "@/components/feed/CategoryFilter";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { Post } from "@/types/database";

export function HomeFeed({
  posts,
  locale,
  isLoggedIn,
}: {
  posts: Post[];
  locale: string;
  isLoggedIn: boolean;
}) {
  const t = useTranslations("feed");

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Composer */}
      <PostComposer locale={locale} isLoggedIn={isLoggedIn} />

      {/* Category Filter */}
      <Suspense fallback={null}>
        <CategoryFilter />
      </Suspense>

      {/* Posts */}
      {posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500">{t("empty.title")}</p>
        </div>
      )}

      {/* View all link */}
      <div className="border-t border-gray-200 p-4 text-center">
        <Link
          href="/feed"
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          {t("viewAll")} →
        </Link>
      </div>
    </div>
  );
}
