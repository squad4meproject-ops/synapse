# SESSION 11 — Filtrage par langue, Profils enrichis, Recherche globale

## Contexte
Synapse est une plateforme communautaire IA (Next.js 14 App Router + TypeScript + Tailwind CSS + Supabase).
Session 10 a ajouté le système de notifications. Cette session ajoute 3 features majeures.

## Rappel des règles du projet
- `users.id` ≠ `auth.uid()`. Le mapping se fait via `users.auth_id = auth.uid()` (type UUID, PAS text)
- Ne JAMAIS caster `auth.uid()` en `::text`
- API routes : `createClient()` pour vérifier l'auth, puis `createServiceClient()` pour bypass RLS sur les mutations
- Toujours ajouter les nouvelles clés de traduction dans les 3 fichiers (en.json, fr.json, es.json)
- `setRequestLocale(locale)` requis dans chaque server component
- Utiliser `Array.from(new Set(...))` au lieu de `[...new Set(...)]`

---

# PARTIE A — FILTRAGE DES POSTS PAR LANGUE

## Étape 1 — Ajouter un filtre langue dans le composant `LanguageFilter`

Créer un nouveau composant `src/components/feed/LanguageFilter.tsx` (composant client `'use client'`).

**Fonctionnement :**
- Affiche des boutons pills horizontaux similaires au CategoryFilter existant
- Options : "Toutes" (🌐), "Français" (🇫🇷), "English" (🇬🇧), "Español" (🇪🇸)
- Utilise les search params de l'URL pour stocker le filtre (`?lang=fr`)
- Quand on clique sur une langue, met à jour le paramètre `lang` dans l'URL (comme fait CategoryFilter pour `category`)
- Quand "Toutes" est sélectionné, supprimer le param `lang` de l'URL
- Doit préserver les autres params existants (category, etc.)

**Design :** même style que `CategoryFilter` — boutons pills avec `bg-primary-600 text-white` pour actif, `bg-gray-100 text-gray-600` pour inactif. Placer dans un `div` avec `flex gap-2 overflow-x-auto px-4 py-2`.

**Traductions nécessaires :** ajouter dans la section `feed` des 3 fichiers JSON :
```json
"languages": {
  "all": "All languages",     // fr: "Toutes les langues", es: "Todos los idiomas"
  "fr": "Français",
  "en": "English",
  "es": "Español"
}
```

---

## Étape 2 — Intégrer le LanguageFilter dans la page feed

Modifier `src/app/[locale]/feed/page.tsx` :
1. Ajouter `lang` dans les searchParams attendus : `{ category?: string; page?: string; lang?: string }`
2. Lire `const lang = search.lang;`
3. Passer `locale: lang` à `getPosts()` : `getPosts({ page, category, locale: lang, userId })`
4. Passer `lang` au `LoadMoreButton` comme prop
5. Ajouter `<LanguageFilter />` juste après le `<CategoryFilter />` (dans le même Suspense ou un nouveau)

---

## Étape 3 — Intégrer le filtre langue dans l'API feed et le LoadMoreButton

**Modifier `src/app/api/posts/feed/route.ts` :**
- Lire le paramètre `lang` depuis searchParams : `const lang = searchParams.get('lang');`
- Le passer à `getPosts()` : `getPosts({ page, limit, category, locale: lang || undefined, userId })`

**Modifier `src/components/feed/LoadMoreButton.tsx` :**
- Ajouter une prop `lang?: string` au composant
- L'ajouter aux URLSearchParams dans `loadMore()` : `if (lang) params.set('lang', lang);`

**Note :** `getPosts()` dans `src/lib/queries/posts.ts` supporte DÉJÀ le paramètre `locale` — il applique `.eq('locale', locale)` quand il est défini. Donc PAS besoin de modifier `getPosts()`.

---

# PARTIE B — PROFILS ENRICHIS

## Étape 4 — Améliorer la page profil public (`src/app/[locale]/user/[username]/page.tsx`)

La page profil public existe déjà mais est basique. L'enrichir avec :

1. **En-tête de profil amélioré :**
   - Avatar plus grand (h-20 w-20) avec dégradé si pas d'avatar
   - Affichage du display_name en gros + @username en dessous
   - Bio complète
   - Badges : "Premium" si `is_premium`, date d'inscription
   - Liens sociaux (lire depuis `social_links` dans la table users si le champ existe, sinon ignorer)

2. **Stats du profil :**
   - Nombre de posts
   - Nombre de commentaires
   - Nombre de likes reçus (somme des likes_count de tous les posts de l'utilisateur)
   - Afficher sous forme de 3 colonnes avec chiffre en gros + label en petit

3. **Onglets pour le contenu :**
   - Onglet "Posts" (par défaut) — affiche les posts de l'utilisateur
   - Onglet "Likes" — affiche les posts likés par l'utilisateur
   - Utiliser des search params pour gérer l'onglet actif (`?tab=posts` ou `?tab=likes`)

4. **Boutons d'action :**
   - "Message" (déjà existant) → ouvre une conversation
   - Ne s'affiche que si l'utilisateur connecté visite le profil d'un AUTRE utilisateur

**Traductions nécessaires :** ajouter dans la section `profile` des 3 fichiers JSON :
```json
"publicProfile": {
  "posts": "Posts",
  "likes": "Likes",
  "joinedOn": "Joined {date}",
  "premium": "Premium",
  "sendMessage": "Message",
  "postsCount": "{count} posts",
  "commentsCount": "{count} comments",
  "likesCount": "{count} likes received",
  "noPosts": "This user hasn't posted yet.",
  "noLikes": "This user hasn't liked any posts yet."
}
```

---

## Étape 5 — Rendre le username cliquable dans les PostCard

Modifier `src/components/feed/PostCard.tsx` :
- Le nom de l'auteur du post doit être un lien cliquable vers `/user/{username}`
- Utiliser le composant `Link` de `@/i18n/routing`
- Style : `hover:underline` pour indiquer que c'est cliquable
- Si l'auteur n'a pas de username, utiliser `#` comme fallback (pas de lien)

---

# PARTIE C — RECHERCHE GLOBALE

## Étape 6 — Créer l'API de recherche (`src/app/api/search/route.ts`)

**Endpoint : GET /api/search?q=query&type=all&limit=10**

Paramètres :
- `q` (requis) — le terme de recherche (minimum 2 caractères)
- `type` (optionnel) — `all`, `posts`, `users`, `articles`, `tools` (défaut: `all`)
- `limit` (optionnel) — max 20, défaut 10

Fonctionnement :
- Utiliser `createServiceClient()` pour les requêtes
- Recherche sur les posts : `content.ilike('%query%')` + `prompt_content.ilike('%query%')`
- Recherche sur les users : `display_name.ilike('%query%')` + `username.ilike('%query%')`
- Recherche sur les articles : chercher dans `article_translations` où `title.ilike('%query%')` + `excerpt.ilike('%query%')`
- Recherche sur les ai_tools : chercher dans `tool_translations` où `name.ilike('%query%')` + `description.ilike('%query%')`
- Limiter chaque type à `limit` résultats
- Pour `type=all`, retourner un objet avec toutes les catégories

**Important :** utiliser `.or()` de Supabase pour combiner les conditions ilike. Exemple : `.or('content.ilike.%query%,prompt_content.ilike.%query%')`

**Format de réponse :**
```json
{
  "posts": [{ "id": "...", "content": "...", "author": { "display_name": "...", "username": "..." }, "created_at": "..." }],
  "users": [{ "id": "...", "display_name": "...", "username": "...", "avatar_url": "...", "bio": "..." }],
  "articles": [{ "id": "...", "title": "...", "excerpt": "...", "slug": "..." }],
  "tools": [{ "id": "...", "name": "...", "description": "...", "slug": "...", "logo_url": "..." }]
}
```

---

## Étape 7 — Créer le composant SearchBar (`src/components/search/SearchBar.tsx`)

**Composant client** avec :

1. **Input de recherche :**
   - Icône loupe (SVG) à gauche
   - Placeholder traduit : "Rechercher..."
   - Debounce de 300ms avant de lancer la recherche (pas de fetch à chaque frappe)
   - Bouton X pour effacer la recherche

2. **Dropdown de résultats** (apparaît quand on tape + résultats trouvés) :
   - Sections séparées : "Utilisateurs", "Posts", "Articles", "Outils"
   - Chaque section affiche max 3 résultats avec un lien "Voir tout"
   - Résultats cliquables qui naviguent vers la bonne page
   - État vide : "Aucun résultat pour 'query'"
   - État loading : spinner ou shimmer

3. **Navigation au clic :**
   - Post → `/feed` (on ne peut pas link un post individuel pour l'instant)
   - User → `/user/{username}`
   - Article → `/articles/{slug}`
   - Tool → `/tools/{slug}`

4. **Fermeture du dropdown :**
   - Clic en dehors → fermer (même pattern que NotificationBell avec useRef + mousedown)
   - Touche Escape → fermer

**Design :**
- Container : `relative` pour le dropdown
- Input : `rounded-lg border border-gray-200 bg-gray-50 px-10 py-2 text-sm`, focus: `ring-2 ring-primary-300 border-primary-400`
- Dropdown : `absolute top-full mt-1 w-full rounded-xl border bg-white shadow-card max-h-96 overflow-y-auto z-50`

**Traductions nécessaires :** ajouter une section `search` dans les 3 fichiers JSON :
```json
"search": {
  "placeholder": "Search...",        // fr: "Rechercher...", es: "Buscar..."
  "noResults": "No results for \"{query}\"",  // fr: "Aucun résultat pour \"{query}\"", es: "Sin resultados para \"{query}\""
  "users": "Users",                  // fr: "Utilisateurs", es: "Usuarios"
  "posts": "Posts",                  // fr: "Publications", es: "Publicaciones"
  "articles": "Articles",           // fr: "Articles", es: "Artículos"
  "tools": "Tools",                 // fr: "Outils", es: "Herramientas"
  "viewAll": "View all",            // fr: "Voir tout", es: "Ver todo"
  "searching": "Searching..."       // fr: "Recherche...", es: "Buscando..."
}
```

---

## Étape 8 — Intégrer la SearchBar dans le Header

Modifier `src/components/layout/Header.tsx` :
- Importer le composant SearchBar
- L'ajouter dans le header entre la navigation et les actions (NotificationBell, LocaleSwitcher, AuthButton)
- Sur desktop : afficher directement l'input (largeur `w-48 lg:w-64`)
- Sur mobile : optionnel — soit masquer, soit afficher une icône loupe qui ouvre l'input

```tsx
<div className="hidden items-center gap-3 md:flex">
  <SearchBar />                    {/* ← AJOUTER ICI */}
  <NotificationBellWrapper />
  <LocaleSwitcher />
  <AuthButton />
</div>
```

---

## Étape 9 — Vérification

1. Lancer `npx tsc --noEmit` et corriger toutes les erreurs TypeScript
2. Vérifier que les 3 fichiers de traduction sont du JSON valide
3. S'assurer que tous les imports sont corrects
4. Tester le build : `npx next build`

---

## Résumé des fichiers à créer
- `src/components/feed/LanguageFilter.tsx` (filtre par langue)
- `src/app/api/search/route.ts` (API de recherche)
- `src/components/search/SearchBar.tsx` (barre de recherche)

## Résumé des fichiers à modifier
- `src/app/[locale]/feed/page.tsx` — ajouter LanguageFilter + param lang
- `src/app/api/posts/feed/route.ts` — passer param lang à getPosts
- `src/components/feed/LoadMoreButton.tsx` — propager param lang
- `src/app/[locale]/user/[username]/page.tsx` — enrichir la page profil public
- `src/components/feed/PostCard.tsx` — rendre le username cliquable
- `src/components/layout/Header.tsx` — ajouter SearchBar
- `src/messages/en.json` — sections languages, publicProfile, search
- `src/messages/fr.json` — sections languages, publicProfile, search
- `src/messages/es.json` — sections languages, publicProfile, search

## Aucune migration SQL nécessaire pour cette session
