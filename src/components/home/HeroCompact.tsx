"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";

export function HeroCompact() {
  const t = useTranslations("home");

  return (
    <section className="bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 py-8 sm:py-12">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-base font-medium text-primary-200 sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/feed"
              className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-xs font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
            >
              {t("getStarted")}
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center rounded-lg border border-primary-300/30 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t("exploreTools")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
