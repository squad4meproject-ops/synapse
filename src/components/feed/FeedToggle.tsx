"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

export function FeedToggle() {
  const t = useTranslations("feed");
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFeed = searchParams.get("feed") || "all";

  const handleToggle = (feed: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (feed === "all") {
      params.delete("feed");
    } else {
      params.set("feed", feed);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-gray-700 dark:bg-gray-900">
      <button
        onClick={() => handleToggle("all")}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
          currentFeed === "all"
            ? "bg-primary-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        }`}
      >
        {t("feedToggle.all")}
      </button>
      <button
        onClick={() => handleToggle("following")}
        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
          currentFeed === "following"
            ? "bg-primary-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        }`}
      >
        {t("feedToggle.following")}
      </button>
    </div>
  );
}
