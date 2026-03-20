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
    title: "Politique de Confidentialité — Synapse",
    description: "Politique de confidentialité et protection des données personnelles",
    locale,
    path: "/privacy",
  });
}

export default async function PrivacyPolicyPage({
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

        <h1 className="text-3xl font-bold text-gray-900">{t("privacyPolicy")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("lastUpdated", { date: "20/03/2026" })}</p>

        <div className="prose prose-gray mt-8 max-w-none">
          <h2>1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement des données personnelles est <strong>Benjamin Martin</strong>,
            micro-entrepreneur, domicilié au 1 La Bande Neuve, 56220 Malansac, France.
          </p>
          <p>Contact : <a href="mailto:squad4me.project@gmail.com">squad4me.project@gmail.com</a></p>

          <h2>2. Données collectées</h2>
          <p>Nous collectons les données suivantes :</p>
          <ul>
            <li><strong>Données d&apos;inscription :</strong> adresse email, nom d&apos;affichage, nom d&apos;utilisateur, photo de profil (via Google/GitHub OAuth)</li>
            <li><strong>Données de profil :</strong> biographie, liens sociaux (renseignés volontairement)</li>
            <li><strong>Contenu utilisateur :</strong> posts, commentaires, likes, bookmarks publiés sur la plateforme</li>
            <li><strong>Données techniques :</strong> adresse IP, type de navigateur, pages visitées (via cookies de session)</li>
          </ul>

          <h2>3. Finalités du traitement</h2>
          <p>Vos données sont utilisées pour :</p>
          <ul>
            <li>Créer et gérer votre compte utilisateur</li>
            <li>Permettre la publication de contenu et les interactions communautaires</li>
            <li>Personnaliser votre expérience (préférence de langue, contenu recommandé)</li>
            <li>Assurer la sécurité et la modération de la plateforme</li>
            <li>Améliorer le service via des statistiques anonymisées</li>
          </ul>

          <h2>4. Base légale</h2>
          <p>Le traitement de vos données repose sur :</p>
          <ul>
            <li><strong>Votre consentement</strong> (inscription, publication de contenu)</li>
            <li><strong>L&apos;exécution du contrat</strong> (fourniture du service)</li>
            <li><strong>L&apos;intérêt légitime</strong> (sécurité, modération, amélioration du service)</li>
          </ul>

          <h2>5. Durée de conservation</h2>
          <ul>
            <li><strong>Données de compte :</strong> conservées tant que le compte est actif, puis supprimées dans les 30 jours suivant la suppression du compte</li>
            <li><strong>Contenu publié :</strong> conservé tant que le compte est actif ou jusqu&apos;à suppression par l&apos;utilisateur</li>
            <li><strong>Données techniques :</strong> 12 mois maximum</li>
          </ul>

          <h2>6. Destinataires des données</h2>
          <p>Vos données peuvent être partagées avec :</p>
          <ul>
            <li><strong>Supabase Inc.</strong> — hébergement de la base de données (serveur à Francfort, Allemagne)</li>
            <li><strong>Vercel Inc.</strong> — hébergement du site web</li>
            <li><strong>Google / GitHub</strong> — authentification OAuth (uniquement si vous choisissez ces méthodes de connexion)</li>
            <li><strong>Anthropic</strong> — traduction de contenu (le texte à traduire est envoyé à l&apos;API, sans données personnelles)</li>
          </ul>
          <p>Nous ne vendons jamais vos données personnelles à des tiers.</p>

          <h2>7. Transferts internationaux</h2>
          <p>
            Certains sous-traitants (Vercel, Supabase, Google, Anthropic) peuvent traiter des données en dehors de l&apos;Union européenne.
            Ces transferts sont encadrés par des clauses contractuelles types (CCT) conformément au RGPD.
          </p>

          <h2>8. Vos droits (RGPD)</h2>
          <p>Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles</li>
            <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
            <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données</li>
            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format lisible</li>
            <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos données</li>
            <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment</li>
          </ul>
          <p>
            Pour exercer vos droits, contactez-nous à : <a href="mailto:squad4me.project@gmail.com">squad4me.project@gmail.com</a>
          </p>
          <p>
            Si vous estimez que le traitement de vos données ne respecte pas la réglementation,
            vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés) :
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer"> www.cnil.fr</a>
          </p>

          <h2>9. Cookies</h2>
          <p>
            Le site utilise des cookies strictement nécessaires au fonctionnement du service :
          </p>
          <ul>
            <li><strong>Cookies de session Supabase :</strong> authentification et maintien de la connexion</li>
            <li><strong>Cookie de préférence de langue :</strong> mémoriser votre choix de langue</li>
          </ul>
          <p>
            Aucun cookie publicitaire ou de traçage n&apos;est utilisé.
            Aucun outil d&apos;analytics tiers n&apos;est actuellement installé.
          </p>

          <h2>10. Sécurité</h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
            chiffrement HTTPS, authentification sécurisée via OAuth 2.0, séparation des rôles d&apos;accès à la base de données (RLS),
            et hébergement sur des infrastructures certifiées.
          </p>

          <h2>11. Modifications</h2>
          <p>
            Cette politique peut être mise à jour. En cas de modification substantielle, nous vous en informerons via le site.
            La date de dernière mise à jour est indiquée en haut de cette page.
          </p>
        </div>
      </Container>
    </div>
  );
}
