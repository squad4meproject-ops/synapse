import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";

export function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-xl font-medium text-primary-200 sm:text-2xl">
            {t("subtitle")}
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base text-primary-100/80 sm:text-lg">
            {t("heroDescription")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/articles"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50"
            >
              {t("getStarted")}
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center rounded-lg border border-primary-300/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t("exploreTools")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
