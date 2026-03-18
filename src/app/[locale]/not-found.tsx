import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  const t = useTranslations("common");

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-4 text-xl text-gray-600">{t("notFound")}</p>
      <p className="mt-2 text-gray-500">{t("notFoundDescription")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700"
      >
        {t("backToHome")}
      </Link>
    </Container>
  );
}
