"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { Tag } from "@/types/database";

export function PopularTags() {
  const t = useTranslations("feed");
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tags?limit=10")
      .then(res => res.json())
      .then(data => setTags(data.tags || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-gray-700 dark:bg-gray-900">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs dark:bg-indigo-900/30">#</span>
          {t("tags.popular")}
        </h3>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card dark:border-gray-700 dark:bg-gray-900">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs dark:bg-indigo-900/30">#</span>
          {t("tags.popular")}
        </h3>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{t("tags.noTags")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover dark:border-gray-700 dark:bg-gray-900">
      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-100">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs dark:bg-indigo-900/30">#</span>
        {t("tags.popular")}
      </h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/feed?tag=${tag.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
          >
            <span>#{tag.name}</span>
            <span className="text-[10px] font-normal text-indigo-600 dark:text-indigo-500">
              {tag.posts_count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
