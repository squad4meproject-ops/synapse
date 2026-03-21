# SESSION 14A — Système XP / Réputation / Niveaux

## Contexte
Synapse est une plateforme communautaire IA (Next.js 14 App Router + TypeScript + Tailwind CSS + Supabase).
On ajoute un système de gamification : les utilisateurs gagnent des XP pour leurs actions, montent de niveau, et débloquent des badges automatiques.

## Rappel des règles du projet
- `users.id` ≠ `auth.uid()`. Mapping via `users.auth_id = auth.uid()` (UUID)
- Ne JAMAIS caster `auth.uid()` en `::text`
- API routes : `createClient()` pour auth, `createServiceClient()` pour mutations (bypass RLS)
- Traductions dans les 3 fichiers (en.json, fr.json, es.json)
- `setRequestLocale(locale)` dans chaque server component
- `Array.from(new Set(...))` au lieu de `[...new Set(...)]`
- `useRouter` importé de `@/i18n/routing` (JAMAIS de `next/navigation`)
- Toujours ajouter les classes `dark:` pour le dark mode

## Barème XP

| Action | XP |
|--------|-----|
| Publier un post | +10 |
| Écrire un commentaire | +5 |
| Recevoir un like sur un post | +3 |
| Recevoir un like sur un commentaire | +2 |
| Recevoir un nouveau follower | +5 |
| Première connexion du jour (daily login) | +2 |

## Niveaux

| Niveau | XP minimum | Titre EN | Titre FR | Titre ES |
|--------|-----------|----------|----------|----------|
| 1 | 0 | Newcomer | Débutant | Novato |
| 2 | 50 | Explorer | Explorateur | Explorador |
| 3 | 150 | Contributor | Contributeur | Contribuidor |
| 4 | 400 | Active Member | Membre actif | Miembro activo |
| 5 | 800 | Expert | Expert | Experto |
| 6 | 1500 | Master | Maître | Maestro |
| 7 | 3000 | Legend | Légende | Leyenda |

## Badges automatiques

| Badge | Condition | Icon | Couleur |
|-------|-----------|------|---------|
| First Post | Publier son premier post | 📝 | bg-blue-500 |
| Socializer | 10 commentaires écrits | 💬 | bg-green-500 |
| Popular | Recevoir 50 likes au total | ❤️ | bg-red-500 |
| Influencer | Avoir 10 followers | 🌟 | bg-yellow-500 |
| Veteran | Atteindre le niveau 5 | 🏆 | bg-purple-500 |
| Legend | Atteindre le niveau 7 | 👑 | bg-amber-500 |

---

# PARTIE 1 — MIGRATION SQL

## Étape 1 — Créer la migration `supabase/migrations/022_xp_system.sql`

⚠️ **Ce fichier SQL sera exécuté manuellement par le développeur sur Supabase.**

```sql
-- =============================================
-- SESSION 14A : Système XP / Réputation
-- =============================================

-- 1. Ajouter les colonnes XP et niveau sur la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level_title TEXT DEFAULT 'Newcomer';

-- 2. Table d'historique des gains XP
CREATE TABLE IF NOT EXISTS xp_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'post', 'comment', 'like_received_post', 'like_received_comment', 'new_follower', 'daily_login'
  xp_amount INTEGER NOT NULL,
  reference_id UUID, -- ID du post/commentaire/like concerné (optionnel)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Index pour performance
CREATE INDEX IF NOT EXISTS idx_xp_events_user_id ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created_at ON xp_events(created_at);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);

-- 4. RLS sur xp_events
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own xp events"
  ON xp_events FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Service role can insert xp events"
  ON xp_events FOR INSERT
  WITH CHECK (true);

-- 5. Ajouter les badges automatiques dans la table badges (s'ils n'existent pas)
INSERT INTO badges (name_en, name_fr, name_es, description_en, description_fr, description_es, icon, color, category)
VALUES
  ('First Post', 'Premier post', 'Primer post', 'Published your first post', 'A publié son premier post', 'Publicó su primer post', '📝', 'bg-blue-500', 'xp'),
  ('Socializer', 'Sociable', 'Sociable', 'Wrote 10 comments', 'A écrit 10 commentaires', 'Escribió 10 comentarios', '💬', 'bg-green-500', 'xp'),
  ('Popular', 'Populaire', 'Popular', 'Received 50 likes', 'A reçu 50 likes', 'Recibió 50 likes', '❤️', 'bg-red-500', 'xp'),
  ('Influencer', 'Influenceur', 'Influencer', 'Gained 10 followers', 'A gagné 10 abonnés', 'Ganó 10 seguidores', '🌟', 'bg-yellow-500', 'xp'),
  ('Veteran', 'Vétéran', 'Veterano', 'Reached level 5', 'A atteint le niveau 5', 'Alcanzó el nivel 5', '🏆', 'bg-purple-500', 'xp'),
  ('Legend', 'Légende', 'Leyenda', 'Reached level 7', 'A atteint le niveau 7', 'Alcanzó el nivel 7', '👑', 'bg-amber-500', 'xp')
ON CONFLICT DO NOTHING;
```

**Note :** La table `badges` existe déjà (migration 018). Si la colonne `category` n'existe pas, ajouter :
```sql
ALTER TABLE badges ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'manual';
```
avant les INSERT.

---

# PARTIE 2 — API BACKEND

## Étape 2 — Créer le service XP `src/lib/xp.ts`

Ce fichier centralise toute la logique XP : attribution, calcul du niveau, vérification des badges.

```typescript
import { createServiceClient } from "@/lib/supabase/service";

// Barème XP
const XP_VALUES: Record<string, number> = {
  post: 10,
  comment: 5,
  like_received_post: 3,
  like_received_comment: 2,
  new_follower: 5,
  daily_login: 2,
};

// Table des niveaux
const LEVELS = [
  { level: 1, xpMin: 0, titleEn: "Newcomer", titleFr: "Débutant", titleEs: "Novato" },
  { level: 2, xpMin: 50, titleEn: "Explorer", titleFr: "Explorateur", titleEs: "Explorador" },
  { level: 3, xpMin: 150, titleEn: "Contributor", titleFr: "Contributeur", titleEs: "Contribuidor" },
  { level: 4, xpMin: 400, titleEn: "Active Member", titleFr: "Membre actif", titleEs: "Miembro activo" },
  { level: 5, xpMin: 800, titleEn: "Expert", titleFr: "Expert", titleEs: "Experto" },
  { level: 6, xpMin: 1500, titleEn: "Master", titleFr: "Maître", titleEs: "Maestro" },
  { level: 7, xpMin: 3000, titleEn: "Legend", titleFr: "Légende", titleEs: "Leyenda" },
];

// Badges automatiques (name_en => condition)
const AUTO_BADGES: { nameEn: string; check: (stats: UserStats) => boolean }[] = [
  { nameEn: "First Post", check: (s) => s.postsCount >= 1 },
  { nameEn: "Socializer", check: (s) => s.commentsCount >= 10 },
  { nameEn: "Popular", check: (s) => s.totalLikesReceived >= 50 },
  { nameEn: "Influencer", check: (s) => s.followersCount >= 10 },
  { nameEn: "Veteran", check: (s) => s.level >= 5 },
  { nameEn: "Legend", check: (s) => s.level >= 7 },
];

interface UserStats {
  postsCount: number;
  commentsCount: number;
  totalLikesReceived: number;
  followersCount: number;
  level: number;
}

function calculateLevel(xp: number): { level: number; titleEn: string; titleFr: string; titleEs: string } {
  let result = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xpMin) result = l;
  }
  return result;
}

export function getLevelInfo(xp: number) {
  const current = calculateLevel(xp);
  const nextLevel = LEVELS.find((l) => l.level === current.level + 1);
  const xpForNext = nextLevel ? nextLevel.xpMin : null;
  const xpProgress = nextLevel ? xp - current.xpMin : xp;
  const xpNeeded = nextLevel ? nextLevel.xpMin - current.xpMin : 0;
  return { ...current, xpForNext, xpProgress, xpNeeded };
}

export async function awardXP(userId: string, action: string, referenceId?: string): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  const xpAmount = XP_VALUES[action];
  if (!xpAmount) return { newXp: 0, newLevel: 1, leveledUp: false };

  const supabase = createServiceClient();

  // 1. Enregistrer l'événement XP
  await supabase.from("xp_events").insert({
    user_id: userId,
    action,
    xp_amount: xpAmount,
    reference_id: referenceId || null,
  });

  // 2. Récupérer l'XP actuel
  const { data: user } = await supabase
    .from("users")
    .select("xp, level")
    .eq("id", userId)
    .single();

  const currentXp = (user?.xp || 0) + xpAmount;
  const oldLevel = user?.level || 1;
  const newLevelInfo = calculateLevel(currentXp);

  // 3. Mettre à jour l'utilisateur
  await supabase
    .from("users")
    .update({
      xp: currentXp,
      level: newLevelInfo.level,
      level_title: newLevelInfo.titleEn,
    })
    .eq("id", userId);

  // 4. Vérifier et attribuer des badges automatiques
  await checkAndAwardBadges(userId, supabase);

  return {
    newXp: currentXp,
    newLevel: newLevelInfo.level,
    leveledUp: newLevelInfo.level > oldLevel,
  };
}

async function checkAndAwardBadges(userId: string, supabase: ReturnType<typeof createServiceClient>) {
  // Récupérer les stats de l'utilisateur
  const [postsRes, commentsRes, likesRes, followersRes, userRes] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", userId),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("author_id", userId),
    supabase.from("posts").select("likes_count").eq("author_id", userId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("users").select("level").eq("id", userId).single(),
  ]);

  const totalLikes = (likesRes.data || []).reduce(
    (sum: number, p: Record<string, number>) => sum + (p.likes_count || 0), 0
  );

  const stats: UserStats = {
    postsCount: postsRes.count || 0,
    commentsCount: commentsRes.count || 0,
    totalLikesReceived: totalLikes,
    followersCount: followersRes.count || 0,
    level: userRes.data?.level || 1,
  };

  // Récupérer les badges déjà attribués
  const { data: existingBadges } = await supabase
    .from("user_badges")
    .select("badge_id, badge:badges(name_en)")
    .eq("user_id", userId);

  const existingNames = (existingBadges || []).map(
    (ub: { badge: { name_en: string } | null }) => ub.badge?.name_en
  );

  // Vérifier chaque badge auto
  for (const autoBadge of AUTO_BADGES) {
    if (existingNames.includes(autoBadge.nameEn)) continue;
    if (!autoBadge.check(stats)) continue;

    // Trouver le badge dans la table
    const { data: badge } = await supabase
      .from("badges")
      .select("id")
      .eq("name_en", autoBadge.nameEn)
      .single();

    if (badge) {
      await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
      });
    }
  }
}
```

---

## Étape 3 — Créer l'API endpoint XP `src/app/api/xp/route.ts`

Endpoint GET pour récupérer les infos XP de l'utilisateur connecté.

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getLevelInfo } from "@/lib/xp";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data: userData } = await serviceClient
      .from("users")
      .select("id, xp, level, level_title")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ xp: 0, level: 1, levelInfo: getLevelInfo(0) });
    }

    // Récupérer l'historique XP récent (10 derniers)
    const { data: recentXp } = await serviceClient
      .from("xp_events")
      .select("action, xp_amount, created_at")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const levelInfo = getLevelInfo(userData.xp || 0);

    return NextResponse.json({
      xp: userData.xp || 0,
      level: userData.level || 1,
      levelTitle: userData.level_title || "Newcomer",
      levelInfo,
      recentXp: recentXp || [],
    });
  } catch (error) {
    console.error("XP fetch error:", error);
    return NextResponse.json({ xp: 0, level: 1, levelInfo: getLevelInfo(0) });
  }
}
```

---

## Étape 4 — Intégrer awardXP dans les API routes existantes

**4a. Après création d'un post** — `src/app/api/posts/route.ts`

Dans la fonction POST, APRÈS l'insertion réussie du post (après le `if (error)` check), ajouter :

```typescript
import { awardXP } from "@/lib/xp";
// ... après insert réussi :
await awardXP(internalUser.id, "post", data.id);
```

**4b. Après création d'un commentaire** — `src/app/api/posts/[id]/comments/route.ts`

Dans la fonction POST, après l'insertion réussie du commentaire :

```typescript
import { awardXP } from "@/lib/xp";
// ... après insert réussi :
await awardXP(internalUser.id, "comment", data.id);
```

**4c. Quand quelqu'un reçoit un like sur un post** — `src/app/api/posts/[id]/like/route.ts`

Quand un like est ajouté (pas retiré), donner XP à l'AUTEUR DU POST (pas au likeur) :

```typescript
import { awardXP } from "@/lib/xp";
// ... après ajout du like (dans le cas "like ajouté", pas "like retiré") :
// Récupérer l'auteur du post
const { data: post } = await serviceClient.from("posts").select("author_id").eq("id", postId).single();
if (post && post.author_id !== internalUser.id) {
  await awardXP(post.author_id, "like_received_post", postId);
}
```

**4d. Quand quelqu'un reçoit un like sur un commentaire** — `src/app/api/comments/[id]/like/route.ts`

Même principe, donner XP à l'auteur du commentaire :

```typescript
import { awardXP } from "@/lib/xp";
// ... après ajout du like :
const { data: comment } = await serviceClient.from("comments").select("author_id").eq("id", commentId).single();
if (comment && comment.author_id !== internalUser.id) {
  await awardXP(comment.author_id, "like_received_comment", commentId);
}
```

**4e. Quand quelqu'un gagne un follower** — `src/app/api/follow/route.ts`

Après le follow (pas le unfollow), donner XP à la personne suivie :

```typescript
import { awardXP } from "@/lib/xp";
// ... après insert du follow :
await awardXP(targetUserId, "new_follower");
```

⚠️ **ATTENTION** : Ne donner des XP que quand l'action est CRÉÉE, pas quand elle est annulée (unlike, unfollow). Vérifier la logique toggle existante dans chaque route.

---

# PARTIE 3 — COMPOSANTS UI

## Étape 5 — Créer le composant XpBar `src/components/xp/XpBar.tsx`

Barre de progression XP affichée sur le profil.

```tsx
"use client";

import { useTranslations } from "next-intl";

interface XpBarProps {
  xp: number;
  level: number;
  levelTitle: string;
  xpProgress: number;
  xpNeeded: number;
  xpForNext: number | null;
}

export function XpBar({ xp, level, levelTitle, xpProgress, xpNeeded, xpForNext }: XpBarProps) {
  const t = useTranslations("xp");
  const progressPercent = xpNeeded > 0 ? Math.min(100, (xpProgress / xpNeeded) * 100) : 100;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-bold text-white">
            {level}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{levelTitle}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{xp} XP {t("total")}</p>
          </div>
        </div>
        {xpForNext && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {xpForNext - xp} XP {t("toNextLevel")}
          </p>
        )}
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {xpForNext && (
        <p className="mt-1 text-right text-[10px] text-gray-400 dark:text-gray-500">
          {xpProgress}/{xpNeeded} XP
        </p>
      )}
    </div>
  );
}
```

---

## Étape 6 — Créer le composant LevelBadge `src/components/xp/LevelBadge.tsx`

Petit badge de niveau affiché à côté du nom d'utilisateur.

```tsx
interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md";
}

export function LevelBadge({ level, size = "sm" }: LevelBadgeProps) {
  const sizeClasses = size === "sm"
    ? "h-5 w-5 text-[10px]"
    : "h-6 w-6 text-xs";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 font-bold text-white ${sizeClasses}`}
      title={`Level ${level}`}
    >
      {level}
    </span>
  );
}
```

---

## Étape 7 — Intégrer la barre XP sur la page profil

**Fichier : `src/app/[locale]/profile/page.tsx`**

**7a.** Ajouter un état pour les données XP :
```tsx
const [xpData, setXpData] = useState<{
  xp: number; level: number; levelTitle: string;
  levelInfo: { xpProgress: number; xpNeeded: number; xpForNext: number | null };
} | null>(null);
```

**7b.** Ajouter le fetch XP dans le useEffect existant (à côté du fetch stats) :
```tsx
fetch('/api/xp').then(res => res.json()).then(setXpData).catch(() => {});
```

**7c.** Afficher la XpBar juste après la section Stats (après le `grid-cols-5`) :
```tsx
import { XpBar } from "@/components/xp/XpBar";

// ... dans le JSX, après le bloc stats :
{xpData && (
  <XpBar
    xp={xpData.xp}
    level={xpData.level}
    levelTitle={xpData.levelTitle}
    xpProgress={xpData.levelInfo.xpProgress}
    xpNeeded={xpData.levelInfo.xpNeeded}
    xpForNext={xpData.levelInfo.xpForNext}
  />
)}
```

---

## Étape 8 — Afficher le niveau dans les PostCards et profils publics

**Fichier : `src/components/feed/PostCard.tsx`**

Importer `LevelBadge` et l'afficher à côté du nom de l'auteur :

```tsx
import { LevelBadge } from "@/components/xp/LevelBadge";

// À côté du display_name de l'auteur, ajouter :
{post.author?.level && <LevelBadge level={post.author.level} />}
```

**IMPORTANT** : Pour que `post.author.level` soit disponible, il faut vérifier que la requête dans `src/lib/queries/posts.ts` sélectionne bien `level` dans le join users. Modifier le select pour inclure `level` :

Dans `getPosts()`, le select des users doit inclure `level` :
```
author:users!posts_author_id_fkey(id, display_name, username, avatar_url, level)
```

---

## Étape 9 — Ajouter le niveau sur le profil public

**Fichier : `src/app/[locale]/user/[username]/page.tsx`**

Importer `LevelBadge` et l'afficher à côté du nom :

```tsx
import { LevelBadge } from "@/components/xp/LevelBadge";

// À côté du h1 display_name, ajouter :
{user.level && <LevelBadge level={user.level} size="md" />}
```

Aussi afficher l'XP dans les stats (ajouter une 6ème colonne ou l'intégrer au bloc existant) :
```tsx
<div className="text-center">
  <p className="text-2xl font-bold text-primary-600">{user.xp || 0}</p>
  <p className="text-xs text-gray-500 dark:text-gray-400">XP</p>
</div>
```

Pour que `user.xp` et `user.level` soient disponibles, vérifier que `getUserByUsername` dans `src/lib/queries/users.ts` sélectionne ces colonnes.

---

## Étape 10 — Ajouter les traductions XP

**Dans les 3 fichiers de traduction** (`en.json`, `fr.json`, `es.json`), ajouter une section `"xp"` :

**en.json :**
```json
"xp": {
  "total": "total",
  "toNextLevel": "to next level",
  "level": "Level",
  "xpGained": "XP gained",
  "levelUp": "Level up!"
}
```

**fr.json :**
```json
"xp": {
  "total": "au total",
  "toNextLevel": "pour le prochain niveau",
  "level": "Niveau",
  "xpGained": "XP gagnés",
  "levelUp": "Niveau supérieur !"
}
```

**es.json :**
```json
"xp": {
  "total": "en total",
  "toNextLevel": "para el siguiente nivel",
  "level": "Nivel",
  "xpGained": "XP ganados",
  "levelUp": "¡Subiste de nivel!"
}
```

---

## Étape 11 — Mettre à jour les types TypeScript

**Fichier : `src/types/database.ts`**

Ajouter les colonnes XP dans le type `users` Row, Insert et Update :
```typescript
xp: number;
level: number;
level_title: string | null;
```

(avec `xp?: number`, `level?: number`, `level_title?: string | null` dans Insert et Update)

---

## Étape 12 — Build de vérification

```bash
npm run build
```

Le build doit passer sans erreur.

---

## Migrations SQL à exécuter manuellement

Le développeur devra exécuter manuellement :
```
supabase/migrations/022_xp_system.sql
```

Puis initialiser les XP des utilisateurs existants (optionnel) :
```sql
-- Donner un peu d'XP aux utilisateurs existants basé sur leurs posts
UPDATE users SET xp = (
  SELECT COALESCE(COUNT(*) * 10, 0) FROM posts WHERE posts.author_id = users.id
) + (
  SELECT COALESCE(COUNT(*) * 5, 0) FROM comments WHERE comments.author_id = users.id
);

-- Recalculer les niveaux
UPDATE users SET level = CASE
  WHEN xp >= 3000 THEN 7
  WHEN xp >= 1500 THEN 6
  WHEN xp >= 800 THEN 5
  WHEN xp >= 400 THEN 4
  WHEN xp >= 150 THEN 3
  WHEN xp >= 50 THEN 2
  ELSE 1
END;

UPDATE users SET level_title = CASE level
  WHEN 7 THEN 'Legend'
  WHEN 6 THEN 'Master'
  WHEN 5 THEN 'Expert'
  WHEN 4 THEN 'Active Member'
  WHEN 3 THEN 'Contributor'
  WHEN 2 THEN 'Explorer'
  ELSE 'Newcomer'
END;
```
