"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { AiTool } from "@/types";

export function TrendingTools({ tools }: { tools: AiTool[] }) {
  const t = useTranslations("home");

  if (!tools.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">{t("featuredTools")}</h3>
        <Link
          href="/tools"
          className="text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          {t("viewAllTools")} →
        </Link>
      </div>
      <div className="mt-3 space-y-3">
        {tools.slice(0, 5).map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.slug}`}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
          >
            {tool.logo_url ? (
              <img
                src={tool.logo_url}
                alt={tool.name}
                className="h-8 w-8 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-600">
                {tool.name[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{tool.name}</p>
              <p className="truncate text-xs text-gray-500">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
