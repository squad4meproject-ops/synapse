# SESSION 7B — Redesign Homepage (Feed Social au centre + Sidebar)

## Contexte
La homepage actuelle (`src/app/[locale]/page.tsx`) affiche :
1. Un **HeroSection** plein écran (bandeau violet `py-20 sm:py-28`)
2. **FeaturedTools** — grille 3 colonnes de ToolCards
3. **LatestArticles** — grille 3 colonnes d'ArticleCards

L'objectif est de transformer la homepage en **hub communautaire** :
- Hero compact (1/3 de la taille actuelle)
- Feed social (posts) au centre comme colonne principale
- Sidebar à droite avec les outils et articles

## IMPORTANT — Règles pour Claude Code
- Fais chaque étape **une par une**, dans l'ordre
- Ne combine PAS plusieurs commandes bash sur la même ligne
- Après chaque fichier créé/modifié, vérifie qu'il compile : `npx tsc --noEmit --pretty 2>&1 | head -30`
- N'utilise PAS `setRequestLocale` dans les composants client ("use client")
- `setRequestLocale(locale)` doit être appelé dans chaque **page** et **layout** server component
- La table users utilise `display_name` (PAS `name`)
- Utilise les imports existants : `@/i18n/routing` pour Link, `@/components/ui/Container` pour Container

---

## Étape 1 : Créer le composant `HeroCompact`

Créer `src/components/home/HeroCompact.tsx`

C'est une version compacte du HeroSection. Au lieu du gros bandeau plein écran, on veut :
- Padding réduit : `py-8 sm:py-12` (au lieu de `py-20 sm:py-28`)
- Titre plus petit : `text-2xl sm:text-3xl` (au lieu de `text-4xl sm:text-5xl lg:text-6xl`)
- Supprimer le paragraphe `heroDescription`
- Garder les 2 boutons (Get Started + Explore Tools) mais les rendre plus petits (`px-4 py-2 text-xs`)
- Garder le gradient background
- Utiliser les mêmes traductions du namespace "home"

Le composant est un **client component** car il utilise `useTranslations`.

```tsx
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
```

Après création, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 2 : Créer le composant sidebar `TrendingTools`

Créer `src/components/home/TrendingTools.tsx`

Ce composant affiche les outils IA featured sous forme de **petites cartes compactes** dans la sidebar.

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { AiTool } from "@/types";

export function TrendingTools({ tools }: { tools: AiTool[] }) {
  const t = useTranslations("home");

  if (!tools.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">{t("featuredTools")}</h3>
        <Link
          href="/tools"
          className="text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          {t("viewAllTools")} →
        </Link>
      </div>
      <div className="mt-3 space-y-3">
        {tools.slice(0, 5).map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.slug}`}
            className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
          >
            {tool.logo_url ? (
              <img
                src={tool.logo_url}
                alt={tool.name}
                className="h-8 w-8 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-600">
                {tool.name[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{tool.name}</p>
              <p className="truncate text-xs text-gray-500">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

Après création, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 3 : Créer le composant sidebar `RecentArticles`

Créer `src/components/home/RecentArticles.tsx`

Affiche les derniers articles sous forme de **liste de liens compacte** dans la sidebar.

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { ArticleWithTranslation } from "@/types";

export function RecentArticles({
  articles,
  locale,
}: {
  articles: ArticleWithTranslation[];
  locale: string;
}) {
  const t = useTranslations("home");

  if (!articles.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">{t("latestArticles")}</h3>
        <Link
          href="/articles"
          className="text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          {t("viewAllArticles")} →
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {articles.slice(0, 5).map((article) => {
          const translation = article.translations?.[0];
          const title = translation?.title || article.title;

          return (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="block rounded-lg p-2 transition-colors hover:bg-gray-50"
            >
              <p className="text-sm font-medium text-gray-900 line-clamp-2">{title}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {new Date(article.published_at || article.created_at).toLocaleDateString(locale)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

Après création, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

**NOTE** : Si le type `ArticleWithTranslation` n'a pas de champ `translations`, adapte le code pour utiliser directement `article.title`. Vérifie la définition du type dans `src/types/index.ts`.

---

## Étape 4 : Créer le composant sidebar `TopContributors`

Créer `src/components/home/TopContributors.tsx`

Affiche les utilisateurs qui ont le plus de posts. On fait une query simple.

```tsx
import { createClient } from "@/lib/supabase/server";

async function getTopContributors() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, display_name, username, avatar_url")
      .order("created_at", { ascending: true })
      .limit(5);

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

export async function TopContributors() {
  const contributors = await getTopContributors();

  if (!contributors.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-bold text-gray-900">Top Contributors</h3>
      <div className="mt-3 space-y-3">
        {contributors.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name || ""}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                {(user.display_name || user.username || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user.display_name || user.username || "Anonymous"}
              </p>
              {user.username && (
                <p className="truncate text-xs text-gray-500">@{user.username}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**IMPORTANT** : Ce composant est un **server component** (PAS de "use client") car il fait un appel Supabase directement. Il sera appelé dans la page homepage qui est aussi un server component.

Après création, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 5 : Créer le composant `HomeFeed` (wrapper client du feed)

Créer `src/components/home/HomeFeed.tsx`

Ce composant client affiche le PostComposer + CategoryFilter + la liste des PostCard sur la homepage. Il reçoit les données en props (fetched côté serveur dans la page).

```tsx
"use client";

import { Suspense } from "react";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { CategoryFilter } from "@/components/feed/CategoryFilter";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { Post } from "@/types/database";

export function HomeFeed({
  posts,
  locale,
  isLoggedIn,
}: {
  posts: Post[];
  locale: string;
  isLoggedIn: boolean;
}) {
  const t = useTranslations("feed");

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Composer */}
      <PostComposer locale={locale} isLoggedIn={isLoggedIn} />

      {/* Category Filter */}
      <Suspense fallback={null}>
        <CategoryFilter />
      </Suspense>

      {/* Posts */}
      {posts.length > 0 ? (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-gray-500">{t("empty.title")}</p>
        </div>
      )}

      {/* View all link */}
      <div className="border-t border-gray-200 p-4 text-center">
        <Link
          href="/feed"
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          {t("viewAll")} →
        </Link>
      </div>
    </div>
  );
}
```

Après création, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 6 : Ajouter les traductions manquantes

Dans `src/messages/en.json`, dans le namespace `"feed"`, ajouter la clé :
```json
"viewAll": "View all posts"
```

Dans `src/messages/fr.json`, dans le namespace `"feed"`, ajouter :
```json
"viewAll": "Voir tous les posts"
```

Dans `src/messages/es.json`, dans le namespace `"feed"`, ajouter :
```json
"viewAll": "Ver todas las publicaciones"
```

Aussi, dans le namespace `"home"` de chaque fichier, ajouter une nouvelle clé pour la sidebar "Top Contributors" :

**en.json** `"home"` :
```json
"topContributors": "Top Contributors"
```

**fr.json** `"home"` :
```json
"topContributors": "Top Contributeurs"
```

**es.json** `"home"` :
```json
"topContributors": "Mejores Contribuidores"
```

Après modification, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 7 : Réécrire la page homepage `src/app/[locale]/page.tsx`

C'est l'étape principale. Remplacer tout le contenu du fichier.

La nouvelle homepage a cette structure :
1. **HeroCompact** (bandeau réduit, pleine largeur)
2. **Section 2 colonnes** (Container `max-w-7xl`) :
   - Colonne principale (gauche, `lg:w-2/3`) : **HomeFeed** (PostComposer + filter + posts)
   - Sidebar (droite, `lg:w-1/3`) : **TrendingTools** + **RecentArticles** + **TopContributors**
3. Sur mobile : sidebar passe en dessous du feed (flex-col → flex-row sur lg)

```tsx
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getArticles } from "@/lib/queries/articles";
import { getFeaturedTools } from "@/lib/queries/tools";
import { getPosts } from "@/lib/queries/posts";
import { createClient } from "@/lib/supabase/server";
import { HeroCompact } from "@/components/home/HeroCompact";
import { HomeFeed } from "@/components/home/HomeFeed";
import { TrendingTools } from "@/components/home/TrendingTools";
import { RecentArticles } from "@/components/home/RecentArticles";
import { TopContributors } from "@/components/home/TopContributors";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/constants";
import type { PostCategory } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  return generatePageMetadata({
    title: t("homeTitle"),
    description: t("homeDescription"),
    locale,
  });
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  setRequestLocale(locale);

  // Check if user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userId: string | undefined;
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
      .single();
    userId = userData?.id;
  }

  // Fetch all data in parallel
  const category = search.category as PostCategory | undefined;

  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  let tools: Awaited<ReturnType<typeof getFeaturedTools>> = [];
  let postsData = { posts: [] as Awaited<ReturnType<typeof getPosts>>["posts"], total: 0 };

  try {
    [articles, tools, postsData] = await Promise.all([
      getArticles(locale),
      getFeaturedTools(locale),
      getPosts({ page: 1, limit: 10, category, userId }),
    ]);
  } catch {
    // fail gracefully
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Synapse",
          url: SITE_URL,
          description:
            "The global AI community platform for tools, articles, and collaboration.",
        }}
      />

      {/* Compact Hero */}
      <HeroCompact />

      {/* Main content: Feed + Sidebar */}
      <div className="bg-gray-50 py-6 sm:py-8">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Main column: Feed */}
            <main className="min-w-0 flex-1">
              <HomeFeed
                posts={postsData.posts}
                locale={locale}
                isLoggedIn={!!user}
              />
            </main>

            {/* Sidebar */}
            <aside className="w-full space-y-6 lg:w-80 lg:flex-shrink-0">
              <TrendingTools tools={tools} />
              <RecentArticles articles={articles} locale={locale} />
              <Suspense fallback={null}>
                <TopContributors />
              </Suspense>
            </aside>
          </div>
        </Container>
      </div>
    </>
  );
}
```

Après réécriture, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 8 : Vérification TypeScript complète

Lancer une vérification complète du projet :

```bash
npx tsc --noEmit --pretty
```

S'il y a des erreurs, les corriger une par une.

Erreurs probables et solutions :
- **`ArticleWithTranslation` n'a pas `translations`** : vérifier le type dans `src/types/index.ts`. Si le type utilise `article_translations` au lieu de `translations`, adapter `RecentArticles.tsx`.
- **`Post` type incompatible** : vérifier dans `src/types/database.ts`
- **`searchParams` type** : la homepage n'avait pas `searchParams` avant. S'assurer que le type est correct (`Promise<{ category?: string }>` pour Next.js 14 App Router).
- **Traduction `feed.viewAll` manquante** : vérifier que l'étape 6 a bien été faite.

---

## Étape 9 : Test local (optionnel si le build passe)

```bash
npm run build 2>&1 | tail -40
```

Si le build passe, c'est bon. S'il y a des erreurs, les corriger.

---

## Étape 10 : Commit Git

**NE PAS PUSH.** Juste commiter.

```bash
git add src/components/home/HeroCompact.tsx
git add src/components/home/TrendingTools.tsx
git add src/components/home/RecentArticles.tsx
git add src/components/home/TopContributors.tsx
git add src/components/home/HomeFeed.tsx
git add src/app/\[locale\]/page.tsx
git add src/messages/en.json
git add src/messages/fr.json
git add src/messages/es.json
```

Puis commiter :

```bash
git commit -m "Redesign homepage: compact hero, community feed center, sidebar with tools/articles/contributors

Session 7B: Homepage redesign
- HeroCompact: reduced hero banner (1/3 original size)
- HomeFeed: PostComposer + CategoryFilter + PostCards on homepage
- TrendingTools: compact sidebar widget for featured AI tools
- RecentArticles: compact sidebar widget for latest articles
- TopContributors: sidebar widget showing active community members
- 2-column layout: feed (left) + sidebar (right), responsive on mobile
- Added i18n translations for new UI elements"
```

**NE PAS PUSH** — on pushera les sessions 7A et 7B ensemble après vérification.
