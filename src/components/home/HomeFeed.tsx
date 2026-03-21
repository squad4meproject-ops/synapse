"use client";

import { Suspense } from "react";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { CategoryFilter } from "@/components/feed/CategoryFilter";
import { FeedToggle } from "@/components/feed/FeedToggle";
import { LoadMoreButton } from "@/components/feed/LoadMoreButton";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { Post } from "@/types/database";

export function HomeFeed({
  posts,
  locale,
  isLoggedIn,
  currentUserId,
  total = 0,
}: {
  posts: Post[];
  locale: string;
  isLoggedIn: boolean;
  currentUserId?: string;
  total?: number;
}) {
  const t = useTranslations("feed");

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-gray-700 dark:bg-gray-900">
      {/* Composer */}
      <PostComposer locale={locale} isLoggedIn={isLoggedIn} />

      {/* Feed Toggle */}
      <Suspense fallback={null}>
        <FeedToggle />
      </Suspense>

      {/* Category Filter */}
      <Suspense fallback={null}>
        <CategoryFilter />
      </Suspense>

      {/* Posts */}
      {posts.length > 0 ? (
        <div className="divide-y divide-gray-100 px-1 dark:divide-gray-800">
          {posts.map((post) => (
            <div key={post.id} className="p-3 sm:p-4">
              <PostCard post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
            </div>
          ))}
          <div className="p-4">
            <LoadMoreButton
              initialPage={1}
              total={total}
              limit={10}
              isLoggedIn={isLoggedIn}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      ) : (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("empty.title")}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("empty.description")}</p>
        </div>
      )}

      {/* View all link */}
      <div className="border-t border-gray-100 bg-gray-50/50 p-4 text-center dark:border-gray-800 dark:bg-gray-800/50">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          {t("viewAll")}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
