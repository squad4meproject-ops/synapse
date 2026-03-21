# PROMPT DE CONTINUITÉ — SESSION 13

Copie-colle ce message en entier dans une nouvelle conversation pour reprendre le développement de Synapse.

---

## Contexte du projet

Je développe **Synapse**, une plateforme communautaire internationale dédiée à l'IA. Le site est live sur Vercel : `synapse-ecru-ten.vercel.app`

### Stack technique
- **Frontend** : Next.js 14 App Router + TypeScript + Tailwind CSS
- **Backend** : Supabase (PostgreSQL, région Frankfurt)
- **Auth** : Supabase Auth — pattern : `users.auth_id = auth.uid()` (UUID, jamais caster en text)
- **API** : `createClient()` pour vérifier l'auth, puis `createServiceClient()` (service_role) pour les mutations (bypass RLS)
- **i18n** : next-intl v3.25, routing par locale (/en/, /fr/, /es/), `setRequestLocale(locale)` obligatoire dans chaque server component
- **Traductions** : toujours dans 3 fichiers : `en.json`, `fr.json`, `es.json`
- **TypeScript** : utiliser `Array.from(new Set(...))` au lieu de `[...new Set(...)]` (tsconfig ne supporte pas downlevelIteration)
- **Storage Supabase** : buckets `post-images` et `user-avatars` (public, 5MB)
- **Déploiement** : Vercel Hobby (auto-deploy sur push GitHub)
- **Design** : palette purple/indigo (#f5f3ff → #2e1065), font Inter, ombres custom

### Repo GitHub
`https://github.com/squad4meproject-ops/synapse.git` — branche `main`

---

## Workflow de développement (TRÈS IMPORTANT)

1. **Moi (Benjamin)** : je prépare les fichiers `SESSION_XX_INSTRUCTIONS.md` avec les étapes détaillées
2. **Je copie-colle un message** pour Claude Code avec les étapes à exécuter
3. **Claude Code** exécute le code étape par étape, en me demandant confirmation entre chaque étape
4. **Moi** : j'exécute les migrations SQL manuellement sur le dashboard Supabase
5. **Moi** : je teste sur Vercel après déploiement

### Format du message pour Claude Code :
```
Lis le fichier `SESSION_XX_INSTRUCTIONS.md` et exécute la PARTIE X (étapes N à M) — [description].

- Étape N : [description]
- Étape N+1 : [description]
- ...

**Important : vas-y étape par étape. Après chaque étape terminée, montre-moi ce que tu as fait et attends ma confirmation avant de passer à la suivante.**
```

Les features sont regroupées en blocs (Partie A, B, C...) envoyés séparément à Claude Code.

---

## Historique des sessions complétées

### Sessions 1–9A : Fondations
- Schema DB, auth, profils, outils IA, articles, feed communautaire, likes/bookmarks, messages privés, préférences

### Session 10 : Notifications (commit `31b3971`)
- Système complet de notifications (11 étapes)

### Session 11 : Filtres + Profils + Recherche (commits `a925dc5`, `8369c14`, `5e3bfde`)
- Partie A : Filtre de langue pour le feed
- Partie B : Profils publics enrichis (stats, onglets, liens sociaux)
- Partie C : Recherche globale (API + SearchBar dans le header)

### Session 12 : Avatar, Followers, Dark Mode, Trending, Badges, Sponsored (6 commits)
- **Partie A** — Avatar/bannière upload (commit `c6fa178`) — migration `016`
- **Partie B** — Système de followers (commit `51631f1`) — migration `017`
- **Partie C** — Dark mode (commit `1dd9b38`) — ThemeProvider, ThemeToggle, classes dark:
- **Partie D** — Posts épinglés + trending sidebar (commit `8c78a02`)
- **Partie E** — Système de badges (commit `bb3ba38`) — migration `018`, 6 badges seedés, auto-attribution
- **Partie F** — Posts sponsorisés (commit `15c0a13`) — migration `019`
- **Fix** — Dark mode étendu à plus de composants (commit `e60defe`) — 16 fichiers

**Toutes les migrations (016–019) ont été exécutées sur Supabase.**

---

## État actuel des migrations (19 au total)
```
001_initial_schema.sql → 019_sponsored_posts.sql
```
Toutes exécutées.

---

## Fichiers et composants principaux

### Pages (src/app/[locale]/)
- `page.tsx` — Homepage
- `feed/page.tsx` — Feed communautaire (layout 2 colonnes + sidebar trending)
- `tools/page.tsx` — Répertoire outils IA
- `articles/page.tsx` — Articles
- `profile/page.tsx` — Profil utilisateur (édition)
- `user/[username]/page.tsx` — Profil public
- `messages/page.tsx` — Messagerie privée
- `bookmarks/page.tsx` — Bookmarks

### Composants (src/components/)
- **feed/** : PostCard, PostComposer, CategoryFilter, LanguageFilter, CommentSection, LoadMoreButton, TrendingPosts, MessageButton
- **home/** : HeroSection, HeroCompact, HomeFeed, FeaturedTools, RecentArticles, TopContributors, LatestArticles, TrendingTools
- **layout/** : Header, Footer, CookieBanner, LocaleSwitcher, MobileNav
- **profile/** : AvatarUpload, FollowButton
- **theme/** : ThemeProvider, ThemeToggle
- **notifications/** : NotificationBell, NotificationBellWrapper
- **search/** : SearchBar
- **tools/** : ToolCard, ToolFilter
- **articles/** : ArticleCard, ArticleContent
- **ui/** : Badge, Button, Card, Container, Logo, Skeleton

### Libs clés
- `src/lib/supabase/service.ts` — createServiceClient()
- `src/lib/notifications/create.ts` — createNotification()
- `src/lib/badges/check.ts` — checkAndAwardBadges()
- `src/lib/queries/posts.ts` — getPosts()
- `src/lib/queries/users.ts` — getUserByUsername(), getFollowStats(), getUserBadges()

---

## 🔴 PROBLÈME PRIORITAIRE À CORRIGER — DARK MODE INCOMPLET

Le dark mode a été implémenté en Session 12 (Partie C + fix e60defe) mais reste **incomplet**. Voici les problèmes identifiés :

### Problèmes visuels constatés :
1. **Page Outils IA** (`/tools`) : les cartes d'outils restent en fond blanc, texte sombre invisible sur fond sombre dans certaines zones
2. **Page Articles** (`/articles`) : les cartes d'articles ont un fond blanc, titres et descriptions mal contrastés
3. **Feed** : certains éléments de PostCard (traductions, prompts, liens, badges de langue) manquent de classes dark:
4. **PostComposer** : certains inputs et boutons restent en light
5. **Homepage** : gradient de fond partiel

### Audit détaillé par fichier — Classes dark: manquantes :

**PostCard.tsx (le plus touché — ~20 instances) :**
- `text-gray-900` sur noms d'auteur → ajouter `dark:text-gray-100`
- `text-gray-500` sur username/timestamp → ajouter `dark:text-gray-400`
- `bg-gray-100` sur badge de langue → ajouter `dark:bg-gray-800`
- `hover:bg-gray-100` sur boutons pin/delete → ajouter `dark:hover:bg-gray-700`
- `border-blue-200` + `bg-blue-50` sur bloc traduction → ajouter `dark:border-blue-900 dark:bg-blue-900/30`
- `text-blue-600` sur header traduction → ajouter `dark:text-blue-400`
- `text-gray-800` sur contenu traduit → ajouter `dark:text-gray-200`
- `bg-gray-100` + `text-gray-600` sur bouton traduire → ajouter `dark:bg-gray-800 dark:text-gray-400`
- `border-primary-200` + `bg-primary-50` sur bloc prompt → ajouter `dark:border-primary-900/50 dark:bg-primary-900/20`
- `text-primary-700` et `text-primary-600` sur prompt → ajouter `dark:text-primary-400`
- `text-gray-800` sur contenu prompt → ajouter `dark:text-gray-300`
- `border-gray-200` + `hover:bg-gray-50` sur lien preview → ajouter `dark:border-gray-700 dark:hover:bg-gray-800`
- `border-gray-300` + `text-gray-600` sur bouton annuler → ajouter `dark:border-gray-600 dark:text-gray-300`

**PostComposer.tsx :**
- `bg-red-50` + `text-red-600` sur message erreur → ajouter `dark:bg-red-900/30 dark:text-red-400`
- `bg-primary-50` + `text-gray-900` sur textarea prompt → ajouter `dark:bg-primary-900/20 dark:text-gray-100`
- `border-gray-200` + `text-gray-900` sur input lien → ajouter `dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100`
- `bg-gray-100` + `text-gray-600` sur boutons action → ajouter `dark:bg-gray-800 dark:text-gray-400`

**tools/page.tsx :**
- `text-gray-900` sur titre → ajouter `dark:text-gray-100`
- `text-gray-600` sur description → ajouter `dark:text-gray-400`

**ToolCard.tsx :**
- `text-gray-900` sur nom outil → ajouter `dark:text-gray-100`
- `text-gray-600` sur description → ajouter `dark:text-gray-400`
- Fond de la carte probablement `bg-white` → ajouter `dark:bg-gray-800`

**articles/page.tsx :**
- `text-gray-900` sur titre → ajouter `dark:text-gray-100`
- `text-gray-600` sur description → ajouter `dark:text-gray-400`

**ArticleCard.tsx :**
- `bg-gray-100` sur placeholder image → ajouter `dark:bg-gray-800`
- `text-gray-900` sur titre article → ajouter `dark:text-gray-100`
- `text-gray-600` sur extrait → ajouter `dark:text-gray-400`
- `text-gray-500` sur métadonnées → ajouter `dark:text-gray-400`

**Homepage (page.tsx) :**
- `from-gray-50 to-white` gradient → ajouter `dark:from-gray-950 dark:to-gray-900`

**FeaturedTools.tsx :**
- `text-gray-900` sur titre section → ajouter `dark:text-gray-100`

### Règle de mapping dark mode à appliquer systématiquement :
| Light | Dark |
|-------|------|
| `bg-white` | `dark:bg-gray-800` ou `dark:bg-gray-900` |
| `bg-gray-50` | `dark:bg-gray-900` |
| `bg-gray-100` | `dark:bg-gray-800` |
| `text-gray-900` | `dark:text-gray-100` |
| `text-gray-800` | `dark:text-gray-200` |
| `text-gray-700` | `dark:text-gray-300` |
| `text-gray-600` | `dark:text-gray-400` |
| `text-gray-500` | `dark:text-gray-400` |
| `border-gray-200` | `dark:border-gray-700` |
| `border-gray-300` | `dark:border-gray-600` |
| `hover:bg-gray-50` | `dark:hover:bg-gray-800` |
| `hover:bg-gray-100` | `dark:hover:bg-gray-700` |

---

## Ce que je veux faire en Session 13

### Priorité 1 : Corriger le dark mode complètement
- Passer en revue CHAQUE composant et CHAQUE page
- Appliquer les classes dark: manquantes listées ci-dessus
- S'assurer qu'aucun texte n'est caché par manque de contraste
- Tester visuellement (build OK ne suffit pas)

### Priorité 2 : Nouvelles fonctionnalités (à discuter)
Quelques idées pour la suite :
- Système de commentaires amélioré (réponses imbriquées, likes sur commentaires)
- Page admin pour gérer les posts sponsorisés, badges manuels, modération
- Profils enrichis (bio longue, liens sociaux multiples, portfolio)
- Système de tags/hashtags sur les posts
- Fil d'actualité personnalisé (basé sur les follows)
- Messagerie améliorée (conversations de groupe, statut en ligne)
- SEO avancé (sitemap dynamique, OpenGraph images)

---

## Rappels importants
- **Ne JAMAIS modifier les fichiers directement** — toujours passer par le workflow instructions → Claude Code
- **Migrations SQL** : je les exécute moi-même sur le dashboard Supabase
- **Tests** : je teste sur Vercel après chaque déploiement
- Le fichier `SESSION_12_INSTRUCTIONS.md` existe déjà dans le repo pour référence
- Dernier commit : `e60defe` — fix dark mode (partiel)
