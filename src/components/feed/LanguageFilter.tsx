"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

const langOptions = [
  { value: "all", icon: "🌐" },
  { value: "fr", icon: "🇫🇷" },
  { value: "en", icon: "🇬🇧" },
  { value: "es", icon: "🇪🇸" },
];

export function LanguageFilter() {
  const t = useTranslations("feed");
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentLang = searchParams.get("lang") || "all";

  const handleFilter = (lang: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (lang === "all") {
      params.delete("lang");
    } else {
      params.set("lang", lang);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 sm:px-6">
      {langOptions.map((lang) => (
        <button
          key={lang.value}
          onClick={() => handleFilter(lang.value)}
          className={`flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            currentLang === lang.value
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          }`}
        >
          <span>{lang.icon}</span>
          {t(`languages.${lang.value}`)}
        </button>
      ))}
    </div>
  );
}
