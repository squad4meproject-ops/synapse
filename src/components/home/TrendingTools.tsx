"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { AiTool } from "@/types";

export function TrendingTools({ tools }: { tools: AiTool[] }) {
  const t = useTranslations("home");

  if (!tools.length) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-primary-100 text-xs">🔥</span>
          {t("featuredTools")}
        </h3>
        <Link
          href="/tools"
          className="text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          {t("viewAllTools")} →
        </Link>
      </div>
      <div className="mt-4 space-y-1">
        {tools.slice(0, 5).map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.slug}`}
            className="flex items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-primary-50/50"
          >
            {tool.logo_url ? (
              <img
                src={tool.logo_url}
                alt={tool.name}
                className="h-9 w-9 rounded-xl object-contain shadow-sm"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-bold text-white shadow-sm">
                {tool.name[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{tool.name}</p>
              <p className="truncate text-xs text-gray-500">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
