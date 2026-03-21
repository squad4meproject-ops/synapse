# SESSION 7E — Traduction Claude, Logos, Mentions Légales, Confidentialité

## 4 choses à faire :
1. **Remplacer MyMemory par l'API Anthropic (Claude)** pour les traductions — qualité naturelle
2. **Fixer les logos manquants** sur les outils IA (certains Clearbit ne marchent pas)
3. **Page Mentions Légales** (obligatoire en France)
4. **Page Politique de Confidentialité** (RGPD)

## IMPORTANT — Règles pour Claude Code
- Fais chaque étape **une par une**, dans l'ordre
- Ne combine PAS plusieurs commandes bash sur la même ligne
- Après chaque fichier modifié, vérifie la compilation : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 1 : Installer le SDK Anthropic

```bash
npm install @anthropic-ai/sdk
```

Après installation, vérifier : `npx tsc --noEmit --pretty 2>&1 | head -10`

---

## Étape 2 : Remplacer l'API route de traduction

Remplacer **tout le contenu** de `src/app/api/translate/route.ts` par :

```ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const langNames: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
};

// POST /api/translate — Traduire du texte via Claude (haute qualité)
export async function POST(request: NextRequest) {
  try {
    const { text, from, to } = await request.json();

    if (!text || !from || !to) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (from === to) {
      return NextResponse.json({ translated: text });
    }

    // Limiter à 1000 caractères pour contrôler les coûts
    const trimmedText = text.slice(0, 1000);
    const fromLang = langNames[from] || from;
    const toLang = langNames[to] || to;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Translate the following text from ${fromLang} to ${toLang}. Return ONLY the translation, nothing else. Do not add quotes or explanations.\n\nText to translate:\n${trimmedText}`,
        },
      ],
    });

    const translated = message.content[0].type === 'text' ? message.content[0].text : '';

    if (!translated) {
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }

    return NextResponse.json({ translated: translated.trim() });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
```

**NOTE** : On utilise `claude-haiku-4-5-20251001` qui est le modèle le plus rapide et le moins cher (~$0.001 par traduction). Parfait pour des traductions courtes.

Après modification, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 3 : Fixer les logos manquants — migration SQL 012

Certains logos Clearbit ne fonctionnent pas. Créer une migration qui utilise des favicons Google comme fallback.

Créer `supabase/migrations/012_fix_tool_logos.sql` :

```sql
-- ============================================================
-- Migration 012: Fix broken tool logos
-- Utilise Google Favicon API comme fallback fiable
-- ============================================================

UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=cursor.sh&sz=64' WHERE slug = 'cursor' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%cursor%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=runwayml.com&sz=64' WHERE slug = 'runway' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%runwayml%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=elevenlabs.io&sz=64' WHERE slug = 'elevenlabs' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%elevenlabs%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=notion.so&sz=64' WHERE slug = 'notion-ai' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%notion%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=jasper.ai&sz=64' WHERE slug = 'jasper' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%jasper%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=suno.com&sz=64' WHERE slug = 'suno' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%suno%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=pika.art&sz=64' WHERE slug = 'pika' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%pika%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=github.com&sz=64' WHERE slug = 'copilot' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%github%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64' WHERE slug = 'gemini' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%gemini%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=openai.com&sz=64' WHERE slug = 'sora' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=leonardo.ai&sz=64' WHERE slug = 'leonardo' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%leonardo%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=v0.dev&sz=64' WHERE slug = 'v0' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%v0%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=huggingface.co&sz=64' WHERE slug = 'huggingface' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%huggingface%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=ideogram.ai&sz=64' WHERE slug = 'ideogram' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%ideogram%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=gamma.app&sz=64' WHERE slug = 'gamma' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%gamma%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=otter.ai&sz=64' WHERE slug = 'otter' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%otter%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=replicate.com&sz=64' WHERE slug = 'replicate' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%replicate%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=descript.com&sz=64' WHERE slug = 'descript' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%descript%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=anthropic.com&sz=64' WHERE slug = 'anthropic-claude' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%anthropic%');
UPDATE ai_tools SET logo_url = 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64' WHERE slug = 'perplexity' AND (logo_url IS NULL OR logo_url LIKE '%clearbit%perplexity%');
```

Affiche le SQL complet à l'écran pour que l'utilisateur puisse le copier dans Supabase SQL Editor.

---

## Étape 4 : Ajouter les traductions pour les pages légales

Dans `src/messages/en.json`, ajouter un nouveau namespace `"legal"` au même niveau que `"home"`, `"feed"`, etc. :

```json
"legal": {
  "legalNotice": "Legal Notice",
  "privacyPolicy": "Privacy Policy",
  "lastUpdated": "Last updated: {date}",
  "backToHome": "Back to Home"
}
```

Dans `src/messages/fr.json`, ajouter :

```json
"legal": {
  "legalNotice": "Mentions Légales",
  "privacyPolicy": "Politique de Confidentialité",
  "lastUpdated": "Dernière mise à jour : {date}",
  "backToHome": "Retour à l'accueil"
}
```

Dans `src/messages/es.json`, ajouter :

```json
"legal": {
  "legalNotice": "Aviso Legal",
  "privacyPolicy": "Política de Privacidad",
  "lastUpdated": "Última actualización: {date}",
  "backToHome": "Volver al inicio"
}
```

Après modification, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 5 : Créer la page Mentions Légales

Créer le fichier `src/app/[locale]/legal/page.tsx` :

```tsx
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
          ← {t("backToHome")}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">{t("legalNotice")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("lastUpdated", { date: "20/03/2026" })}</p>

        <div className="prose prose-gray mt-8 max-w-none">
          <h2>1. Éditeur du site</h2>
          <p>
            Le site <strong>Synapse</strong> (accessible à l'adresse <a href="https://synapse-ecru-ten.vercel.app" target="_blank" rel="noopener noreferrer">synapse-ecru-ten.vercel.app</a>) est édité par :
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
            L'ensemble du contenu éditorial du site (articles, textes, design, logo) est la propriété de Benjamin Martin, sauf mention contraire.
            Le contenu généré par les utilisateurs (posts, commentaires, prompts) reste la propriété de leurs auteurs respectifs.
            Les logos et marques des outils IA référencés appartiennent à leurs propriétaires respectifs.
          </p>

          <h2>4. Contenu généré par les utilisateurs (UGC)</h2>
          <p>
            Synapse est une plateforme communautaire. Les utilisateurs sont responsables du contenu qu'ils publient.
            L'éditeur se réserve le droit de supprimer tout contenu contraire aux lois en vigueur ou aux conditions d'utilisation.
          </p>

          <h2>5. Responsabilité</h2>
          <p>
            L'éditeur s'efforce de fournir des informations exactes et à jour, mais ne garantit pas l'exactitude, la complétude ou l'actualité des informations diffusées sur le site.
            L'utilisation des outils IA référencés se fait sous la responsabilité de l'utilisateur.
          </p>

          <h2>6. Liens hypertextes</h2>
          <p>
            Le site peut contenir des liens vers des sites tiers. L'éditeur n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
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
```

Après création, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 6 : Créer la page Politique de Confidentialité

Créer le fichier `src/app/[locale]/privacy/page.tsx` :

```tsx
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
          ← {t("backToHome")}
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
            <li><strong>Données d'inscription :</strong> adresse email, nom d'affichage, nom d'utilisateur, photo de profil (via Google/GitHub OAuth)</li>
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
            <li><strong>L'exécution du contrat</strong> (fourniture du service)</li>
            <li><strong>L'intérêt légitime</strong> (sécurité, modération, amélioration du service)</li>
          </ul>

          <h2>5. Durée de conservation</h2>
          <ul>
            <li><strong>Données de compte :</strong> conservées tant que le compte est actif, puis supprimées dans les 30 jours suivant la suppression du compte</li>
            <li><strong>Contenu publié :</strong> conservé tant que le compte est actif ou jusqu'à suppression par l'utilisateur</li>
            <li><strong>Données techniques :</strong> 12 mois maximum</li>
          </ul>

          <h2>6. Destinataires des données</h2>
          <p>Vos données peuvent être partagées avec :</p>
          <ul>
            <li><strong>Supabase Inc.</strong> — hébergement de la base de données (serveur à Francfort, Allemagne)</li>
            <li><strong>Vercel Inc.</strong> — hébergement du site web</li>
            <li><strong>Google / GitHub</strong> — authentification OAuth (uniquement si vous choisissez ces méthodes de connexion)</li>
            <li><strong>Anthropic</strong> — traduction de contenu (le texte à traduire est envoyé à l'API, sans données personnelles)</li>
          </ul>
          <p>Nous ne vendons jamais vos données personnelles à des tiers.</p>

          <h2>7. Transferts internationaux</h2>
          <p>
            Certains sous-traitants (Vercel, Supabase, Google, Anthropic) peuvent traiter des données en dehors de l'Union européenne.
            Ces transferts sont encadrés par des clauses contractuelles types (CCT) conformément au RGPD.
          </p>

          <h2>8. Vos droits (RGPD)</h2>
          <p>Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
          <ul>
            <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
            <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
            <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format lisible</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
            <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment</li>
          </ul>
          <p>
            Pour exercer vos droits, contactez-nous à : <a href="mailto:squad4me.project@gmail.com">squad4me.project@gmail.com</a>
          </p>
          <p>
            Si vous estimez que le traitement de vos données ne respecte pas la réglementation,
            vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) :
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
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
            Aucun cookie publicitaire ou de traçage n'est utilisé.
            Aucun outil d'analytics tiers n'est actuellement installé.
          </p>

          <h2>10. Sécurité</h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
            chiffrement HTTPS, authentification sécurisée via OAuth 2.0, séparation des rôles d'accès à la base de données (RLS),
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
```

Après création, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 7 : Ajouter les liens dans le Footer

Modifier `src/components/layout/Footer.tsx` pour ajouter des liens vers les pages légales.

Chercher le composant Footer et ajouter des liens vers `/legal` et `/privacy` dans la section existante. Si le Footer a juste un copyright simple, le remplacer par :

Vérifier d'abord le contenu actuel du Footer avec `cat src/components/layout/Footer.tsx`, puis ajouter les liens. Les liens doivent utiliser `Link` de `@/i18n/routing`. Exemple d'ajout :

```tsx
<Link href="/legal" className="text-sm text-gray-500 hover:text-gray-700">
  Mentions légales
</Link>
<span className="text-gray-300">·</span>
<Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
  Confidentialité
</Link>
```

**IMPORTANT** : Lire le fichier Footer.tsx existant AVANT de le modifier pour comprendre la structure actuelle. Ne pas remplacer tout le fichier — juste ajouter les liens.

Après modification, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 8 : Vérification TypeScript + Build

```bash
npx tsc --noEmit --pretty
```

```bash
npm run build 2>&1 | tail -40
```

---

## Étape 9 : Commit + Push

```bash
git add src/app/api/translate/route.ts
git add src/app/[locale]/legal/page.tsx
git add src/app/[locale]/privacy/page.tsx
git add src/components/layout/Footer.tsx
git add src/messages/en.json
git add src/messages/fr.json
git add src/messages/es.json
git add supabase/migrations/012_fix_tool_logos.sql
git add package.json
git add package-lock.json
```

```bash
git commit -m "Upgrade translation to Claude API, fix tool logos, add legal and privacy pages

Session 7E:
- Replace MyMemory with Anthropic Claude Haiku for high-quality translations
- Migration 012: Fix broken Clearbit logos with Google Favicon API
- Add Mentions Légales page (/legal) - French law compliance
- Add Privacy Policy page (/privacy) - GDPR compliance
- Add legal links in Footer
- Add i18n translations for legal namespace"
```

```bash
git push origin main
```

---

## Étape 10 : RAPPEL — Exécuter la migration SQL 012 dans Supabase

Rappeler à l'utilisateur qu'il doit exécuter la migration 012 (fix logos) dans Supabase SQL Editor.
Afficher le SQL complet.
