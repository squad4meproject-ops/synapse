import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("navigation");

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Logo className="h-7 w-7" />
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-lg font-bold text-transparent">
                Synapse
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{t("tagline")}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Navigation</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/" className="text-sm text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
                  {nav("home")}
                </Link>
              </li>
              <li>
                <Link href="/feed" className="text-sm text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
                  {nav("community")}
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-sm text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
                  {nav("articles")}
                </Link>
              </li>
              <li>
                <Link href="/tools" className="text-sm text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
                  {nav("tools")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/legal" className="text-sm text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
                  {t("terms")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Community</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <span className="text-sm text-gray-600 dark:text-gray-400">GitHub</span>
              </li>
              <li>
                <span className="text-sm text-gray-600 dark:text-gray-400">Discord</span>
              </li>
              <li>
                <span className="text-sm text-gray-600 dark:text-gray-400">Twitter</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 dark:border-gray-800">
          <p className="text-center text-xs text-gray-400">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </Container>
    </footer>
  );
}
