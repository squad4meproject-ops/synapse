import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSpaces } from "@/lib/queries/spaces";
import { Container } from "@/components/ui/Container";
import { SpaceCard } from "@/components/spaces/SpaceCard";

export default async function SpacesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "spaces" });

  let spaces: Awaited<ReturnType<typeof getSpaces>> = [];
  try {
    spaces = await getSpaces();
  } catch {
    // fail silently
  }

  return (
    <Container className="py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">{t("description")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => (
          <SpaceCard key={space.id} space={space} locale={locale} />
        ))}
      </div>
    </Container>
  );
}
