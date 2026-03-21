"use client";

import { useTranslations } from "next-intl";

interface XpBarProps {
  xp: number;
  level: number;
  levelTitle: string;
  xpProgress: number;
  xpNeeded: number;
  xpForNext: number | null;
}

export function XpBar({ xp, level, levelTitle, xpProgress, xpNeeded, xpForNext }: XpBarProps) {
  const t = useTranslations("xp");
  const progressPercent = xpNeeded > 0 ? Math.min(100, (xpProgress / xpNeeded) * 100) : 100;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-bold text-white">
            {level}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{levelTitle}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{xp} XP {t("total")}</p>
          </div>
        </div>
        {xpForNext && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {xpForNext - xp} XP {t("toNextLevel")}
          </p>
        )}
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {xpForNext && (
        <p className="mt-1 text-right text-[10px] text-gray-400 dark:text-gray-500">
          {xpProgress}/{xpNeeded} XP
        </p>
      )}
    </div>
  );
}
