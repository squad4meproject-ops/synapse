"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

const localeLabels: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value;
    // usePathname from next-intl/routing should return path without locale prefix
    // but we sanitize just in case to avoid /fr/fr double-prefix bug
    let cleanPath = pathname;
    for (const loc of routing.locales) {
      if (cleanPath === `/${loc}` || cleanPath.startsWith(`/${loc}/`)) {
        cleanPath = cleanPath.slice(`/${loc}`.length) || "/";
        break;
      }
    }
    router.replace(cleanPath, { locale: newLocale });
  }

  return (
    <select
      value={locale}
      onChange={onChange}
      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      aria-label="Select language"
    >
      {Object.entries(localeLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
