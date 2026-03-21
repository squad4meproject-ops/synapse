import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSpaceBySlug } from "@/lib/queries/spaces";
import { Container } from "@/components/ui/Container";
import { SpaceContent } from "@/components/spaces/SpaceContent";
import { createClient } from "@/lib/supabase/server";

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  await getTranslations({ locale, namespace: "spaces" });

  const space = await getSpaceBySlug(slug);
  if (!space) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isMember = false;
  let userId: string | undefined;

  if (user) {
    const { data: internalUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single() as { data: { id: string } | null };

    userId = internalUser?.id;
    if (userId) {
      const { count } = await supabase
        .from("space_members")
        .select("id", { count: "exact", head: true })
        .eq("space_id", space.id)
        .eq("user_id", userId);
      isMember = (count || 0) > 0;
    }
  }

  const name = locale === "fr" ? space.name_fr : locale === "es" ? space.name_es : space.name_en;
  const desc = locale === "fr" ? space.description_fr : locale === "es" ? space.description_es : space.description_en;

  return (
    <Container className="py-8">
      <SpaceContent
        space={space}
        name={name}
        description={desc}
        initialIsMember={isMember}
        isLoggedIn={!!user}
        currentUserId={userId}
      />
    </Container>
  );
}
