"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

const categoryOptions: { value: string; icon: string }[] = [
  { value: "all", icon: "📋" },
  { value: "creation", icon: "🎨" },
  { value: "prompt", icon: "💡" },
  { value: "question", icon: "❓" },
  { value: "discussion", icon: "💬" },
  { value: "tool_review", icon: "⭐" },
];

export function CategoryFilter() {
  const t = useTranslations("feed");
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";

  const handleFilter = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "all") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-gray-700 dark:bg-gray-900">
      {categoryOptions.map((cat) => (
        <button
          key={cat.value}
          onClick={() => handleFilter(cat.value)}
          className={`flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            currentCategory === cat.value
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          <span>{cat.icon}</span>
          {t(`categories.${cat.value}`)}
        </button>
      ))}
    </div>
  );
}
