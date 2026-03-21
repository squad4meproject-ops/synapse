# SESSION 13C — Corriger les liens 404 + Followers sur le profil

## Contexte
Synapse utilise `next-intl` avec des routes préfixées par locale (`/fr/`, `/en/`, `/es/`).
Plusieurs composants utilisent `useRouter` de `next/navigation` au lieu de `@/i18n/routing`.
Résultat : `router.push("/messages/123")` navigue vers `/messages/123` (sans locale) → **404**.
Il faut remplacer par `useRouter` de `@/i18n/routing` qui ajoute automatiquement le préfixe locale.

## Rappel des règles du projet
- `useRouter` de `@/i18n/routing` pour TOUTE navigation (push, replace)
- `useSearchParams`, `useParams`, `notFound`, `redirect` restent importés de `next/navigation` (pas disponibles dans next-intl)
- `router.refresh()` fonctionne avec les deux versions de useRouter
- `Array.from(new Set(...))` au lieu de `[...new Set(...)]`

---

# PARTIE 1 — CORRIGER LES IMPORTS useRouter

## Étape 1 — NotificationBell.tsx

**Fichier : `src/components/notifications/NotificationBell.tsx`**

Remplacer la ligne 5 :
```tsx
import { useRouter } from "next/navigation";
```
Par :
```tsx
import { useRouter } from "@/i18n/routing";
```

Ce fichier utilise `router.push("/messages/...")`, `router.push("/feed")`, et `router.push("/notifications")` — tous ont besoin du préfixe locale.

---

## Étape 2 — NotificationsPageClient.tsx

**Fichier : `src/app/[locale]/notifications/NotificationsPageClient.tsx`**

Remplacer la ligne 5 :
```tsx
import { useRouter } from "next/navigation";
```
Par :
```tsx
import { useRouter } from "@/i18n/routing";
```

Ce fichier utilise `router.push("/messages/...")` et `router.push("/feed")`.

---

## Étape 3 — AuthButton.tsx

**Fichier : `src/components/auth/AuthButton.tsx`**

Remplacer la ligne 5 :
```tsx
import { useRouter } from "next/navigation";
```
Par :
```tsx
import { useRouter } from "@/i18n/routing";
```

Ce fichier utilise `router.push("/")` après déconnexion.

---

## Étape 4 — profile/page.tsx

**Fichier : `src/app/[locale]/profile/page.tsx`**

Remplacer la ligne 4 :
```tsx
import { useRouter } from "next/navigation";
```
Par :
```tsx
import { useRouter } from "@/i18n/routing";
```

Ce fichier utilise `router.push("/login")` et `router.push("/")`.

---

## Étape 5 — login/page.tsx

**Fichier : `src/app/[locale]/login/page.tsx`**

Ce fichier importe `useRouter` ET `useSearchParams` de `next/navigation`.

Remplacer :
```tsx
import { useRouter, useSearchParams } from "next/navigation";
```
Par :
```tsx
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
```

Ce fichier utilise `router.push("/")` et `router.refresh()`. Les deux fonctionnent avec le router de next-intl.

---

## Étape 6 — PostComposer.tsx (optionnel mais recommandé)

**Fichier : `src/components/feed/PostComposer.tsx`**

Remplacer la ligne 5 :
```tsx
import { useRouter } from "next/navigation";
```
Par :
```tsx
import { useRouter } from "@/i18n/routing";
```

Ce fichier utilise seulement `router.refresh()` (pas de push), mais autant harmoniser.

---

# PARTIE 2 — AJOUTER FOLLOWERS/FOLLOWING SUR LA PAGE PROFIL

## Étape 7 — Modifier l'API /api/account/stats

**Fichier : `src/app/api/account/stats/route.ts`**

Ajouter les requêtes pour compter followers et following. Après la ligne qui déclare `[postsResult, commentsResult, likesResult]`, ajouter deux nouvelles requêtes.

Le code complet de la route doit devenir :

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Trouver l'user interne
    const { data: userData } = await serviceClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ postsCount: 0, commentsCount: 0, likesReceived: 0, followersCount: 0, followingCount: 0 });
    }

    const [postsResult, commentsResult, likesResult, followersResult, followingResult] = await Promise.all([
      serviceClient.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userData.id),
      serviceClient.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', userData.id),
      serviceClient.from('posts').select('likes_count').eq('author_id', userData.id),
      serviceClient.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userData.id),
      serviceClient.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userData.id),
    ]);

    const likesReceived = (likesResult.data || []).reduce(
      (sum: number, post: Record<string, number>) => sum + (post.likes_count || 0), 0
    );

    return NextResponse.json({
      postsCount: postsResult.count || 0,
      commentsCount: commentsResult.count || 0,
      likesReceived,
      followersCount: followersResult.count || 0,
      followingCount: followingResult.count || 0,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ postsCount: 0, commentsCount: 0, likesReceived: 0, followersCount: 0, followingCount: 0 });
  }
}
```

---

## Étape 8 — Afficher followers/following sur la page profil

**Fichier : `src/app/[locale]/profile/page.tsx`**

**8a.** Modifier l'état initial de `stats` pour inclure followers/following.

Trouver :
```tsx
const [stats, setStats] = useState({ postsCount: 0, commentsCount: 0, likesReceived: 0 });
```
Remplacer par :
```tsx
const [stats, setStats] = useState({ postsCount: 0, commentsCount: 0, likesReceived: 0, followersCount: 0, followingCount: 0 });
```

**8b.** Modifier la section Stats pour passer de 3 colonnes à 5. Trouver le bloc stats avec `grid-cols-3` :

```tsx
<div className="mb-8 grid grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
```

Remplacer par :
```tsx
<div className="mb-8 grid grid-cols-5 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
```

**8c.** Ajouter les deux nouvelles colonnes après la colonne "Likes reçus". Juste après le `</div>` qui ferme la colonne `likesReceived`, ajouter :

```tsx
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.followersCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("followers")}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.followingCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("followingCount")}</p>
        </div>
```

**Note :** Vérifier que les clés `"followers"` et `"followingCount"` existent dans les fichiers de traduction (`en.json`, `fr.json`, `es.json`) sous la section `"profile"`. Si elles n'existent pas, les ajouter :

Dans `en.json` > `profile` :
```json
"followers": "Followers",
"followingCount": "Following"
```

Dans `fr.json` > `profile` :
```json
"followers": "Abonnés",
"followingCount": "Abonnements"
```

Dans `es.json` > `profile` :
```json
"followers": "Seguidores",
"followingCount": "Siguiendo"
```

(Si ces clés existent déjà, ne pas les dupliquer.)

---

## Étape 9 — Build de vérification

```bash
npm run build
```

Le build doit passer sans erreur.

---

## Étape 10 — Commit et push

```bash
git add -A && git commit -m "Fix: use next-intl router everywhere to prevent 404s + add followers count to profile" && git push
```

⚠️ Si le push est rejeté à cause de fichiers sensibles, retirer les fichiers concernés du commit comme à la session précédente.
