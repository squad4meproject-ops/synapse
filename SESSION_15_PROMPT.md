# SYNAPSE — Prompt de continuation (Session 15+)

Tu es mon assistant de développement pour **Synapse**, une plateforme communautaire internationale dédiée à l'IA. Voici le contexte complet du projet pour que tu puisses reprendre exactement là où on s'est arrêté.

---

## 1. STACK TECHNIQUE

- **Framework** : Next.js 14.2.21 (App Router) + TypeScript 5.7 + React 18.3
- **Styling** : Tailwind CSS 3.4 avec `darkMode: "class"`
- **Base de données** : Supabase (PostgreSQL) avec RLS
- **Auth** : Supabase Auth — `users.auth_id = auth.uid()` (UUID, JAMAIS caster en text)
- **i18n** : next-intl v3.25 — 3 langues : `en.json`, `fr.json`, `es.json`
- **Déploiement** : Vercel Hobby (auto-deploy sur push GitHub)
- **Repo** : https://github.com/squad4meproject-ops/synapse.git

### Règles critiques :
- `useRouter` DOIT venir de `@/i18n/routing` (PAS `next/navigation`) pour tout `router.push()`
- `useSearchParams`, `useParams`, `notFound`, `redirect` restent de `next/navigation`
- `createClient()` depuis `@/lib/supabase/server` pour les server components (SSR avec cookies + anon key)
- `createServiceClient()` depuis `@/lib/supabase/service` pour les mutations côté API routes (service_role, bypass RLS)
- `Array.from(new Set(...))` au lieu de `[...new Set(...)]`
- Toujours ajouter les classes `dark:` sur tous les nouveaux composants
- Traductions toujours dans les 3 fichiers : `en.json`, `fr.json`, `es.json`

---

## 2. STRUCTURE DU PROJET

### Pages (src/app/[locale]/) :
- `/` — Page d'accueil (hero + feed + articles + outils)
- `/feed` — Fil communautaire (posts, filtres catégories/langues/tags)
- `/articles` — Articles IA multilingues
- `/articles/[slug]` — Détail article
- `/tools` — Annuaire outils IA
- `/tools/[slug]` — Détail outil
- `/spaces` — Espaces thématiques (sous-communautés)
- `/spaces/[slug]` — Détail espace
- `/profile` — Profil propre (avec XP bar, stats, badges)
- `/user/[username]` — Profil public d'un autre utilisateur
- `/messages` — Liste conversations privées
- `/messages/[conversationId]` — Conversation
- `/notifications` — Notifications
- `/bookmarks` — Posts sauvegardés
- `/login` — Connexion
- `/signup` — Inscription
- `/admin` — Dashboard admin
- `/about` — À propos
- `/legal` — Mentions légales
- `/privacy` — Politique de confidentialité

### Composants clés (src/components/) :
- `layout/` : Header, Footer, MobileNav, LocaleSwitcher, CookieBanner
- `theme/` : ThemeProvider (localStorage + class toggle), ThemeToggle (sun/moon)
- `feed/` : PostCard, PostComposer, CommentSection, CategoryFilter, etc.
- `spaces/` : SpaceCard, SpaceContent
- `xp/` : XpBar, LevelBadge
- `auth/` : AuthButton
- `profile/` : AvatarUpload, FollowButton
- `search/` : SearchBar
- `home/` : HeroSection, HomeFeed, FeaturedTools, etc.

### API Routes (31 routes dans src/app/api/) :
- Posts : CRUD, like, bookmark, pin, delete, comments, trending, feed
- Users : follow, avatar upload
- Spaces : join/leave, posts par espace
- Messages : conversations, messages
- Notifications : list, mark read
- Admin : stats, users management, badges, posts moderation
- XP : get user XP info
- Tags, Badges, Search, Translate, Upload

### Lib (src/lib/) :
- `supabase/` : client.ts, server.ts, service.ts, middleware.ts
- `queries/` : posts.ts, articles.ts, spaces.ts, tools.ts, users.ts, tags.ts, admin.ts
- `xp.ts` : awardXP(), getLevelInfo(), checkAndAwardBadges()
- `notifications/create.ts`, `badges/check.ts`

---

## 3. MIGRATIONS SUPABASE (24 fichiers)

| # | Fichier | Contenu |
|---|---------|---------|
| 001 | initial_schema | Tables users, articles, article_translations, ai_tools |
| 002 | grant_permissions | GRANT sur tables initiales |
| 003 | seed_demo_content | Données démo articles + outils |
| 004 | auth_profiles | Lien auth.uid() → users.auth_id |
| 005 | tool_translations | Traductions outils |
| 006 | community_feed | Posts, comments, likes, bookmarks, post_images |
| 007 | user_premium | Champ is_premium |
| 008 | seed_community_posts | Posts de démonstration |
| 009 | fix_likes_bookmarks_rls | Fix RLS likes/bookmarks |
| 010 | seed_more_tools | Plus d'outils IA |
| 011 | seed_more_articles | Plus d'articles |
| 012 | fix_tool_logos | Fix URLs logos outils |
| 013 | user_preferences | Colonne preferences JSONB |
| 014 | private_messages | Conversations + messages privés |
| 015 | notifications | Table notifications + RLS |
| 016 | user_avatar_banner | Colonnes avatar_url, banner_url |
| 017 | followers | Table followers (follower_id, following_id) |
| 018 | badges | Table badges + user_badges |
| 019 | sponsored_posts | Colonnes sponsor sur posts |
| 020 | tags | Tables tags + post_tags |
| 021 | admin | Champ is_admin sur users |
| 022 | xp_system | Colonnes xp/level sur users, table xp_events, badges XP auto |
| 023 | spaces | Tables spaces + space_members, space_id sur posts, 6 espaces seedés |
| 024 | spaces_grants | GRANT SELECT/INSERT/DELETE sur spaces et space_members |

---

## 4. CE QU'ON A FAIT (Sessions 1–14)

### Sessions 1–12 (fondations) :
- Création complète du projet Next.js 14 + Supabase
- Système d'auth complet (login, signup, profils)
- Fil communautaire (posts avec catégories, likes, commentaires, bookmarks, images)
- Articles multilingues avec traductions
- Annuaire d'outils IA avec catégories et filtres
- Messages privés entre utilisateurs
- Système de notifications
- Followers/following
- Badges
- Tags sur les posts
- Panel admin (modération, stats, gestion users)
- Posts sponsorisés
- Dark mode complet (ThemeProvider + ThemeToggle)
- SEO (JsonLd, meta tags)
- i18n complet (EN/FR/ES)

### Session 13 (corrections) :
- Fix dark mode sur toutes les pages (contraste corrigé sur Articles, Outils, À propos, Profil)
- Fix 404 : `useRouter` remplacé par celui de `@/i18n/routing` dans 6+ composants
- Followers/following count ajouté sur la page profil
- Fix header overflow (suppression lien "About", réduction padding, breakpoint lg)
- Fix avatar ovale (ajout `flex-shrink-0`)
- Fix push GitHub bloqué par secrets (fichiers retirés du tracking + .gitignore)

### Session 14A — Système XP/Réputation :
- `src/lib/xp.ts` : awardXP(), getLevelInfo(), checkAndAwardBadges()
- Niveaux : Newcomer (0), Explorer (100), Contributor (300), Expert (750), Master (1500), Legend (3000)
- XP attribué pour : post créé (15), commentaire (10), like reçu (5), article lu (3), follow reçu (8), espace rejoint (5)
- XpBar sur la page profil, LevelBadge sur les posts et profils publics
- Migration 022 : colonnes xp/level sur users, table xp_events
- **Note** : Le XP est à 0 pour tous les users → il faut initialiser avec des queries SQL

### Session 14B — Espaces Thématiques :
- 6 espaces créés : Prompt Engineering, AI Art, Dev IA, Tools Reviews, AI News, Learning
- Pages `/spaces` (liste) et `/spaces/[slug]` (détail)
- Composants SpaceCard et SpaceContent (join/leave + posts)
- Migration 023 : tables spaces + space_members
- Migration 024 : GRANT permissions (exécuté avec succès)

### Dernier fix en cours (fin session 14) :
- **Page Spaces vide** malgré 6 espaces en DB → **CORRIGÉ** :
  - Cause : `getSpaces()` utilisait `createServiceClient()` au lieu de `createClient()` (le client SSR)
  - Les autres queries (posts, articles) utilisent le client SSR avec cookies → pages dynamiques
  - Le service client ne call pas `cookies()` → Next.js rendait la page en statique au build → résultat vide caché
  - Fix : `getSpaces()` et `getSpaceBySlug()` switchés vers `createClient()` + types Database mis à jour
  - **GRANT exécuté** sur Supabase ✅
  - **Code modifié** dans le repo mais **PAS ENCORE PUSHÉ** sur GitHub → il faut push pour que Vercel redéploie

---

## 5. FICHIERS MODIFIÉS NON PUSHÉS (à push immédiatement)

Ces fichiers ont été modifiés pour fixer la page Spaces :
1. `src/lib/queries/spaces.ts` — Switch vers createClient(), ajout interface Space exportée
2. `src/types/database.ts` — Ajout types spaces + space_members dans Database
3. `src/components/spaces/SpaceCard.tsx` — Import Space type depuis queries/spaces
4. `src/app/[locale]/spaces/[slug]/page.tsx` — Fix casting space_members
5. `supabase/migrations/024_spaces_grants.sql` — GRANT permissions (déjà exécuté sur Supabase)

**Action immédiate** : push ces changements sur GitHub pour déclencher le redéploiement Vercel.

---

## 6. CE QU'IL RESTE À FAIRE

### Priorité 1 — Vérifications immédiates :
- [ ] Push les changements Spaces sur GitHub
- [ ] Vérifier que la page `/spaces` affiche bien les 6 espaces après redéploiement
- [ ] Initialiser le XP des utilisateurs existants (query SQL à préparer)

### Priorité 2 — Nouvelles fonctionnalités prévues (Session 15) :
- [ ] **Comparateur d'outils IA** — Permet aux utilisateurs de comparer 2-3 outils côte à côte
- [ ] **Tutoriels interactifs** — Section tutoriels avec contenu structuré par niveau
- [ ] **Événements communautaires** — Calendrier d'événements IA (webinars, meetups, etc.)

### Priorité 3 — Monétisation :
- [ ] **Stratégie de monétisation complète** — Analyse des options et estimations sur 6 mois, mois par mois
- [ ] Implémentation des mécanismes choisis

---

## 7. WORKFLOW DE TRAVAIL

**IMPORTANT — Voici comment on travaille ensemble :**
1. Je te décris ce que je veux
2. Tu me prépares un fichier `SESSION_XX_INSTRUCTIONS.md` avec les étapes détaillées
3. Tu me donnes le message exact à envoyer à Claude Code
4. Je copie-colle le message dans Claude Code
5. Claude Code exécute étape par étape
6. Je lance les migrations SQL manuellement sur Supabase
7. On vérifie ensemble

---

## 8. PREMIÈRE DEMANDE POUR CETTE SESSION

**Avant de coder quoi que ce soit**, je voudrais que tu :

1. **M'expliques comment monétiser Synapse** — Quelles sont les meilleures stratégies de monétisation pour une communauté IA internationale (freemium, premium, pub, marketplace, etc.)
2. **Me fasses des estimations financières sur 6 mois**, mois par mois, avec des hypothèses réalistes sur le nombre d'utilisateurs, les revenus, et les coûts
3. **Me recommandes un plan d'action** — Par quoi commencer, dans quel ordre implémenter les fonctionnalités payantes

Ensuite on passera au développement des fonctionnalités restantes.
