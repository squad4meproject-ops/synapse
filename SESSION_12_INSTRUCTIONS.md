# SESSION 12 — Avatar/Bannière, Followers, Dark Mode, Trending, Badges, Posts Sponsorisés

## Contexte
Synapse est une plateforme communautaire IA (Next.js 14 App Router + TypeScript + Tailwind CSS + Supabase).
Sessions 10-11 ont ajouté : notifications, filtre par langue, profils enrichis, recherche globale.

## Rappel des règles du projet
- `users.id` ≠ `auth.uid()`. Mapping via `users.auth_id = auth.uid()` (UUID)
- Ne JAMAIS caster `auth.uid()` en `::text`
- API routes : `createClient()` pour auth, `createServiceClient()` pour mutations (bypass RLS)
- Traductions dans les 3 fichiers (en.json, fr.json, es.json)
- `setRequestLocale(locale)` dans chaque server component
- `Array.from(new Set(...))` au lieu de `[...new Set(...)]`
- Bucket Supabase Storage existant : `post-images` (pour les images de posts)

---

# PARTIE A — PHOTO DE PROFIL ET BANNIÈRE

## Étape 1 — Migration SQL (`supabase/migrations/016_user_avatar_banner.sql`)

⚠️ **Ce fichier sera exécuté manuellement sur Supabase par le développeur.**

```sql
-- Ajouter le champ banner_url à la table users
-- (avatar_url existe déjà dans le schéma initial)
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT;
```

**Note :** Il faut aussi créer un bucket `user-avatars` sur Supabase Storage (via le dashboard), avec :
- Public : oui
- Taille max : 5MB
- Types acceptés : image/jpeg, image/png, image/gif, image/webp

---

## Étape 2 — API upload avatar/bannière (`src/app/api/upload/avatar/route.ts`)

Créer une nouvelle route API dédiée à l'upload d'avatars et bannières.

**Endpoint : POST /api/upload/avatar**

Body : FormData avec :
- `file` : le fichier image
- `type` : `'avatar'` ou `'banner'`

Fonctionnement :
1. Vérifier l'auth avec `createClient()`
2. Valider le fichier (types : jpeg/png/gif/webp, taille max 5MB)
3. Trouver l'utilisateur interne via `auth_id`
4. Upload sur Supabase Storage dans le bucket `user-avatars` :
   - Chemin : `{userId}/avatar.{ext}` ou `{userId}/banner.{ext}`
   - Utiliser `upsert: true` pour écraser l'ancien fichier
5. Récupérer l'URL publique via `getPublicUrl()`
6. Mettre à jour la colonne `avatar_url` ou `banner_url` dans la table `users` avec `createServiceClient()`
7. Ajouter `?t={timestamp}` à l'URL pour invalider le cache navigateur
8. Retourner `{ url: publicUrl }`

---

## Étape 3 — Composant AvatarUpload (`src/components/profile/AvatarUpload.tsx`)

Composant client pour uploader avatar et bannière depuis la page profil.

**Avatar :**
- Affiche l'avatar actuel (ou initiales dans un cercle violet si pas d'avatar)
- Taille : `h-24 w-24 rounded-full`
- Overlay au hover : icône appareil photo + "Modifier"
- Input file caché, déclenché au clic
- Après upload : affiche l'URL mise à jour

**Bannière :**
- Affiche la bannière actuelle (ou un dégradé `from-primary-500 to-accent-500` par défaut)
- Taille : `h-32 w-full rounded-xl`
- Overlay au hover : icône appareil photo + "Modifier la bannière"
- Input file caché

**Props :**
```typescript
interface AvatarUploadProps {
  avatarUrl: string | null;
  bannerUrl: string | null;
  displayName: string | null;
  onAvatarChange: (url: string) => void;
  onBannerChange: (url: string) => void;
}
```

**Comportement upload :**
- Afficher un loading spinner pendant l'upload
- Appeler `POST /api/upload/avatar` avec le FormData
- Appeler le callback `onAvatarChange` ou `onBannerChange` avec la nouvelle URL

---

## Étape 4 — Intégrer dans la page profil et le profil public

**Modifier `src/app/[locale]/profile/page.tsx` :**
- Importer et utiliser `AvatarUpload` en haut de la page profil
- Passer les callbacks pour mettre à jour l'état local après upload

**Modifier `src/app/[locale]/user/[username]/page.tsx` :**
- Afficher la bannière en haut de la page profil public (si `banner_url` existe)
- L'avatar doit se chevaucher sur la bannière (position relative, margin-top négatif)
- Style : bannière `h-48 w-full object-cover rounded-t-xl`, avatar `h-24 w-24 rounded-full border-4 border-white -mt-12`

**Traductions nécessaires :** ajouter dans `profile` :
```json
"changeAvatar": "Change photo",      // fr: "Changer la photo", es: "Cambiar foto"
"changeBanner": "Change banner",     // fr: "Changer la bannière", es: "Cambiar banner"
"uploading": "Uploading...",         // fr: "Envoi en cours...", es: "Subiendo..."
"uploadError": "Upload failed"       // fr: "Échec de l'envoi", es: "Error al subir"
```

---

# PARTIE B — SYSTÈME DE FOLLOWERS

## Étape 5 — Migration SQL (`supabase/migrations/017_followers.sql`)

⚠️ **Exécuté manuellement sur Supabase.**

```sql
-- Table followers
CREATE TABLE followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Ne pas se suivre soi-même
ALTER TABLE followers ADD CONSTRAINT followers_no_self_follow CHECK (follower_id != following_id);

-- Index
CREATE INDEX idx_followers_follower ON followers (follower_id);
CREATE INDEX idx_followers_following ON followers (following_id);

-- RLS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view followers"
  ON followers FOR SELECT USING (true);

CREATE POLICY "Service role can insert followers"
  ON followers FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can delete followers"
  ON followers FOR DELETE USING (true);

GRANT SELECT ON followers TO authenticated;
GRANT ALL ON followers TO service_role;
```

---

## Étape 6 — API Follow/Unfollow (`src/app/api/users/[userId]/follow/route.ts`)

**Endpoint : POST /api/users/[userId]/follow** (toggle follow/unfollow)

Fonctionnement :
1. Vérifier l'auth
2. Trouver l'utilisateur interne (le "follower")
3. Le `userId` dans l'URL = l'utilisateur à suivre (le "following")
4. Vérifier qu'on ne se suit pas soi-même
5. Vérifier si déjà suivi → si oui, supprimer (unfollow) → si non, insérer (follow)
6. Si follow : créer une notification de type `'follow'`
7. Retourner `{ following: true/false }`

---

## Étape 7 — API pour récupérer le count followers/following

**Option 1 (recommandée) :** Ajouter les counts dans l'API existante du profil public.
Modifier la query dans `src/lib/queries/users.ts` (ou le fichier équivalent qui fetch le profil) pour inclure :
- `followers_count` : `SELECT COUNT(*) FROM followers WHERE following_id = user.id`
- `following_count` : `SELECT COUNT(*) FROM followers WHERE follower_id = user.id`
- `is_following` : si le viewer suit cet utilisateur

---

## Étape 8 — Composant FollowButton + intégration profil public

Créer `src/components/profile/FollowButton.tsx` :
- Composant client
- Props : `userId`, `initialIsFollowing`, `onToggle?`
- Bouton "Suivre" (outline primary) → "Suivi ✓" (filled primary) quand on suit
- Hover sur "Suivi" → "Ne plus suivre" (texte rouge)
- Appel `POST /api/users/{userId}/follow` au clic

Modifier `src/app/[locale]/user/[username]/page.tsx` :
- Afficher `followers_count` et `following_count` dans les stats
- Ajouter le `FollowButton` à côté du bouton "Message"

**Traductions :**
```json
"follow": "Follow",           // fr: "Suivre", es: "Seguir"
"following": "Following",     // fr: "Suivi", es: "Siguiendo"
"unfollow": "Unfollow",       // fr: "Ne plus suivre", es: "Dejar de seguir"
"followers": "Followers",     // fr: "Abonnés", es: "Seguidores"
"followingCount": "Following" // fr: "Abonnements", es: "Siguiendo"
```

---

# PARTIE C — DARK MODE

## Étape 9 — Configurer Tailwind pour le dark mode

Modifier `tailwind.config.ts` :
- Ajouter `darkMode: 'class'` à la config
- Les classes `dark:` seront activées quand `<html class="dark">` est présent

---

## Étape 10 — Créer le ThemeToggle + ThemeProvider

**Créer `src/components/theme/ThemeProvider.tsx` :**
- Composant client qui wrap l'app
- Lit la préférence depuis un cookie `theme` (ou `localStorage`)
- Applique la classe `dark` sur `<html>` au montage
- Exporte un context `useTheme()` avec `{ theme, toggleTheme }`

**Créer `src/components/theme/ThemeToggle.tsx` :**
- Composant client
- Icône soleil ☀️ (mode clair) / lune 🌙 (mode sombre)
- Au clic : toggle le thème, met à jour le cookie, toggle la classe `dark` sur `<html>`

---

## Étape 11 — Ajouter les classes dark: aux composants principaux

Modifier les fichiers suivants pour ajouter les variantes `dark:` :

**`src/components/layout/Header.tsx` :**
- `bg-white/80` → ajouter `dark:bg-gray-900/80`
- `border-gray-200/80` → ajouter `dark:border-gray-700/80`
- `text-gray-600` → ajouter `dark:text-gray-300`
- Intégrer le `ThemeToggle` dans la barre d'actions (entre SearchBar et NotificationBell)

**`src/app/[locale]/feed/page.tsx` :**
- `bg-gray-50` → ajouter `dark:bg-gray-950`
- `bg-white` → ajouter `dark:bg-gray-900`

**`src/components/feed/PostCard.tsx` :**
- `bg-white` → `dark:bg-gray-800`
- `text-gray-900` → `dark:text-gray-100`
- `text-gray-500` → `dark:text-gray-400`
- `border-gray-200` → `dark:border-gray-700`

**`src/components/layout/Footer.tsx` :**
- Adapter les couleurs pour le dark mode

**`src/app/[locale]/page.tsx` (Home) :**
- Hero section, sidebar, etc. — adapter les backgrounds et textes

**Note :** Ne pas modifier TOUS les composants, se concentrer sur les pages principales (header, footer, feed, profil). Les autres pourront être adaptés dans une session future.

**Intégrer le ThemeProvider dans le layout root (`src/app/[locale]/layout.tsx`) :**
- Wrapper le `{children}` avec `<ThemeProvider>`

**Traductions :**
```json
"theme": {
  "light": "Light mode",    // fr: "Mode clair", es: "Modo claro"
  "dark": "Dark mode"       // fr: "Mode sombre", es: "Modo oscuro"
}
```

---

# PARTIE D — POSTS ÉPINGLÉS + TRENDING

## Étape 12 — API Pin/Unpin post (`src/app/api/posts/[id]/pin/route.ts`)

**Endpoint : POST /api/posts/[id]/pin** (toggle pin)

Le champ `is_pinned` existe déjà sur la table `posts`.

Fonctionnement :
1. Vérifier l'auth
2. Vérifier que l'utilisateur est bien l'auteur du post
3. Toggle `is_pinned` (true ↔ false)
4. Un utilisateur ne peut avoir qu'**un seul** post épinglé → si on épingle un post, désépingler les autres posts de cet auteur
5. Retourner `{ pinned: true/false }`

---

## Étape 13 — Afficher les posts épinglés dans le feed et le profil

**Modifier `src/lib/queries/posts.ts` → `getPosts()` :**
- Ajouter un tri secondaire : `is_pinned DESC, created_at DESC`
- Les posts épinglés apparaissent toujours en premier

**Modifier `src/components/feed/PostCard.tsx` :**
- Si `post.is_pinned === true`, afficher un badge 📌 "Épinglé" en haut du post
- Ajouter un bouton "Épingler" / "Désépingler" dans le menu d'actions (visible uniquement pour l'auteur)

**Modifier la page profil public** (`src/app/[locale]/user/[username]/page.tsx`) :
- Les posts épinglés de l'utilisateur apparaissent en premier dans l'onglet Posts

---

## Étape 14 — Section Trending Posts

**Créer `src/app/api/posts/trending/route.ts` :**
- GET — retourne les 5 posts les plus populaires des dernières 48h
- Score = `likes_count * 2 + comments_count * 3`
- Requête : posts créés dans les 48 dernières heures, triés par score DESC, limit 5
- Retourner : `{ posts: [...] }`

**Créer `src/components/feed/TrendingPosts.tsx` :**
- Composant client qui fetch `/api/posts/trending`
- Affiche une card "🔥 Trending" avec les 5 posts (titre court, auteur, likes/comments count)
- Chaque item est cliquable (navigue vers le feed)

**Intégrer dans la page feed :**
- Transformer le layout feed en 2 colonnes sur desktop : feed (gauche) + sidebar (droite)
- La sidebar contient TrendingPosts
- Sur mobile : TrendingPosts caché ou affiché au-dessus du feed

**Traductions :**
```json
"trending": {
  "title": "Trending",          // fr: "Tendances", es: "Tendencias"
  "noTrending": "No trending posts yet"  // fr: "Pas de tendances", es: "Sin tendencias"
},
"pin": "Pin to profile",        // fr: "Épingler", es: "Fijar"
"unpin": "Unpin",                // fr: "Désépingler", es: "Desfijar"
"pinned": "Pinned"               // fr: "Épinglé", es: "Fijado"
```

---

# PARTIE E — SYSTÈME DE BADGES

## Étape 15 — Migration SQL (`supabase/migrations/018_badges.sql`)

⚠️ **Exécuté manuellement sur Supabase.**

```sql
-- Table badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_es TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  description_es TEXT NOT NULL,
  icon TEXT NOT NULL,          -- emoji ou URL d'icône
  color TEXT NOT NULL,         -- classe CSS couleur (ex: 'bg-yellow-500')
  condition_type TEXT NOT NULL, -- 'posts_count', 'likes_received', 'comments_count', 'member_since', 'manual'
  condition_value INT,          -- ex: 10 (pour "10 posts"), 100 (pour "100 likes")
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table user_badges (quels badges un user a gagné)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges (user_id);

-- RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Anyone can view user badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Service role manages user badges" ON user_badges FOR ALL USING (true);

GRANT SELECT ON badges TO authenticated;
GRANT SELECT ON user_badges TO authenticated;
GRANT ALL ON badges TO service_role;
GRANT ALL ON user_badges TO service_role;

-- Seed des badges de base
INSERT INTO badges (slug, name_en, name_fr, name_es, description_en, description_fr, description_es, icon, color, condition_type, condition_value) VALUES
('early-adopter', 'Early Adopter', 'Pionnier', 'Pionero', 'One of the first community members', 'Un des premiers membres', 'Uno de los primeros miembros', '🌟', 'bg-yellow-500', 'manual', NULL),
('first-post', 'First Post', 'Premier Post', 'Primer Post', 'Published your first post', 'A publié son premier post', 'Publicó su primer post', '✍️', 'bg-blue-500', 'posts_count', 1),
('contributor-10', 'Contributor', 'Contributeur', 'Contribuidor', 'Published 10 posts', 'A publié 10 posts', 'Publicó 10 posts', '📝', 'bg-green-500', 'posts_count', 10),
('popular-50', 'Popular', 'Populaire', 'Popular', 'Received 50 likes', 'A reçu 50 likes', 'Recibió 50 likes', '❤️', 'bg-red-500', 'likes_received', 50),
('popular-100', 'Superstar', 'Superstar', 'Superestrella', 'Received 100 likes', 'A reçu 100 likes', 'Recibió 100 likes', '⭐', 'bg-purple-500', 'likes_received', 100),
('commenter-20', 'Active Commenter', 'Commentateur Actif', 'Comentarista Activo', 'Written 20 comments', 'A écrit 20 commentaires', 'Escribió 20 comentarios', '💬', 'bg-indigo-500', 'comments_count', 20);
```

---

## Étape 16 — API de vérification et attribution des badges

**Créer `src/lib/badges/check.ts` :**

Fonction `checkAndAwardBadges(userId: string)` :
1. Récupérer les stats de l'utilisateur (posts_count, likes_received, comments_count)
2. Récupérer tous les badges avec `condition_type != 'manual'`
3. Récupérer les badges déjà attribués à l'utilisateur
4. Pour chaque badge non encore attribué, vérifier si la condition est remplie
5. Si oui, insérer dans `user_badges`
6. Utiliser `createServiceClient()`

**Intégrer l'appel :**
- Appeler `checkAndAwardBadges(userId)` à la fin de :
  - `POST /api/posts` (après création d'un post)
  - `POST /api/posts/[id]/like` (après un like — vérifier pour l'auteur du post)
  - `POST /api/posts/[id]/comments` (après un commentaire)
- L'appel est asynchrone et non-bloquant (fire-and-forget), comme les notifications

---

## Étape 17 — Afficher les badges sur le profil

**Modifier `src/app/[locale]/user/[username]/page.tsx` :**
- Récupérer les badges de l'utilisateur via `user_badges` JOIN `badges`
- Les afficher sous le nom avec des petites pills : `{icon} {name}` avec la couleur du badge
- Max 5 badges affichés, avec "Voir tout" si plus

**Modifier `src/components/feed/PostCard.tsx` :**
- Optionnel : afficher le badge principal (le plus rare) à côté du nom de l'auteur

---

# PARTIE F — POSTS SPONSORISÉS

## Étape 18 — Migration SQL (`supabase/migrations/019_sponsored_posts.sql`)

⚠️ **Exécuté manuellement sur Supabase.**

```sql
-- Ajouter les colonnes de sponsoring à la table posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sponsor_label TEXT;  -- ex: "Sponsored by OpenAI"
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sponsor_url TEXT;    -- lien du sponsor
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sponsored_until TIMESTAMPTZ;  -- date d'expiration

CREATE INDEX idx_posts_sponsored ON posts (is_sponsored, sponsored_until) WHERE is_sponsored = true;
```

---

## Étape 19 — Afficher les posts sponsorisés dans le feed

**Modifier `src/lib/queries/posts.ts` → `getPosts()` :**
- Avant les posts normaux, récupérer les posts sponsorisés actifs : `is_sponsored = true AND sponsored_until > now()`
- Les insérer en position 1 et 5 du feed (pas tous en haut, pour ne pas gêner)
- Maximum 2 posts sponsorisés par page

**Modifier `src/components/feed/PostCard.tsx` :**
- Si `post.is_sponsored === true`, afficher un badge "Sponsorisé" en haut
- Style : pill dorée `bg-amber-100 text-amber-800` avec icône 💰
- Si `sponsor_url` existe, le label est cliquable
- Le reste du post s'affiche normalement

**Modifier `src/types/database.ts` :**
- Ajouter les champs au type Post :
```typescript
is_sponsored: boolean;
sponsor_label: string | null;
sponsor_url: string | null;
sponsored_until: string | null;
```

**Traductions :**
```json
"sponsored": "Sponsored",    // fr: "Sponsorisé", es: "Patrocinado"
```

---

## Étape 20 — Vérification finale

1. Lancer `npx tsc --noEmit` et corriger toutes les erreurs TypeScript
2. Vérifier que les 3 fichiers de traduction sont du JSON valide
3. S'assurer que tous les imports sont corrects
4. Tester le build : `npx next build`

---

## Résumé des fichiers SQL (exécutés manuellement)
- `supabase/migrations/016_user_avatar_banner.sql`
- `supabase/migrations/017_followers.sql`
- `supabase/migrations/018_badges.sql`
- `supabase/migrations/019_sponsored_posts.sql`

## Résumé des fichiers à créer
- `src/app/api/upload/avatar/route.ts`
- `src/components/profile/AvatarUpload.tsx`
- `src/app/api/users/[userId]/follow/route.ts`
- `src/components/profile/FollowButton.tsx`
- `src/components/theme/ThemeProvider.tsx`
- `src/components/theme/ThemeToggle.tsx`
- `src/app/api/posts/[id]/pin/route.ts`
- `src/app/api/posts/trending/route.ts`
- `src/components/feed/TrendingPosts.tsx`
- `src/lib/badges/check.ts`

## Résumé des fichiers à modifier
- `tailwind.config.ts` — ajouter darkMode: 'class'
- `src/app/[locale]/layout.tsx` — wrapper avec ThemeProvider
- `src/app/[locale]/profile/page.tsx` — AvatarUpload
- `src/app/[locale]/user/[username]/page.tsx` — bannière + followers + badges
- `src/lib/queries/posts.ts` — tri is_pinned + sponsorisés
- `src/lib/queries/users.ts` — counts followers/following
- `src/components/feed/PostCard.tsx` — badges épinglé/sponsorisé + bouton pin
- `src/components/layout/Header.tsx` — ThemeToggle
- `src/app/[locale]/feed/page.tsx` — layout 2 colonnes + TrendingPosts
- `src/types/database.ts` — champs sponsored sur Post
- `src/app/api/posts/route.ts` — appel checkAndAwardBadges
- `src/app/api/posts/[id]/like/route.ts` — appel checkAndAwardBadges
- `src/app/api/posts/[id]/comments/route.ts` — appel checkAndAwardBadges
- `src/messages/en.json`, `fr.json`, `es.json` — nouvelles sections
