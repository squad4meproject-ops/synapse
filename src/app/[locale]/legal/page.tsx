import { getTranslations, setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return generatePageMetadata({
    title: "Mentions Légales — Synapse",
    description: "Mentions légales du site Synapse",
    locale,
    path: "/legal",
  });
}

export default async function LegalNoticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <div className="min-h-screen bg-white py-12">
      <Container className="max-w-3xl">
        <Link href="/" className="mb-6 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
          &larr; {t("backToHome")}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">{t("legalNotice")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("lastUpdated", { date: "20/03/2026" })}</p>

        <div className="prose prose-gray mt-8 max-w-none">
          <h2>1. Éditeur du site</h2>
          <p>
            Le site <strong>Synapse</strong> (accessible à l&apos;adresse <a href="https://synapse-ecru-ten.vercel.app" target="_blank" rel="noopener noreferrer">synapse-ecru-ten.vercel.app</a>) est édité par :
          </p>
          <ul>
            <li><strong>Nom :</strong> Benjamin Martin</li>
            <li><strong>Statut :</strong> Micro-entrepreneur (Profession Libérale Non Réglementée)</li>
            <li><strong>SIRET :</strong> 53700000546100579</li>
            <li><strong>SIREN :</strong> 994905990</li>
            <li><strong>Code NAF :</strong> 6201Z — Programmation informatique</li>
            <li><strong>Adresse :</strong> 1 La Bande Neuve, 56220 Malansac, France</li>
            <li><strong>Email :</strong> squad4me.project@gmail.com</li>
          </ul>

          <h2>2. Hébergement</h2>
          <p>Le site est hébergé par :</p>
          <ul>
            <li><strong>Vercel Inc.</strong></li>
            <li>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
            <li>Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a></li>
          </ul>
          <p>La base de données est hébergée par :</p>
          <ul>
            <li><strong>Supabase Inc.</strong></li>
            <li>970 Toa Payoh North #07-04, Singapore 318992</li>
            <li>Serveur : Francfort, Allemagne (région eu-central-1)</li>
            <li>Site web : <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
          </ul>

          <h2>3. Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble du contenu éditorial du site (articles, textes, design, logo) est la propriété de Benjamin Martin, sauf mention contraire.
            Le contenu généré par les utilisateurs (posts, commentaires, prompts) reste la propriété de leurs auteurs respectifs.
            Les logos et marques des outils IA référencés appartiennent à leurs propriétaires respectifs.
          </p>

          <h2>4. Contenu généré par les utilisateurs (UGC)</h2>
          <p>
            Synapse est une plateforme communautaire. Les utilisateurs sont responsables du contenu qu&apos;ils publient.
            L&apos;éditeur se réserve le droit de supprimer tout contenu contraire aux lois en vigueur ou aux conditions d&apos;utilisation.
          </p>

          <h2>5. Responsabilité</h2>
          <p>
            L&apos;éditeur s&apos;efforce de fournir des informations exactes et à jour, mais ne garantit pas l&apos;exactitude, la complétude ou l&apos;actualité des informations diffusées sur le site.
            L&apos;utilisation des outils IA référencés se fait sous la responsabilité de l&apos;utilisateur.
          </p>

          <h2>6. Liens hypertextes</h2>
          <p>
            Le site peut contenir des liens vers des sites tiers. L&apos;éditeur n&apos;exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
          </p>

          <h2>7. Droit applicable</h2>
          <p>
            Les présentes mentions légales sont soumises au droit français.
            En cas de litige, les tribunaux français seront seuls compétents.
          </p>
        </div>
      </Container>
    </div>
  );
}
