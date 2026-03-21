# SESSION 13 — Supprimer le Dark Mode + Vérifications features

## Contexte
Synapse est une plateforme communautaire IA (Next.js 14 App Router + TypeScript + Tailwind CSS + Supabase).
La Session 12 a ajouté beaucoup de classes `dark:` mais le résultat final est inutilisable (pas de contraste, texte invisible, icônes blanches).
**Décision : on supprime complètement le dark mode pour ne plus perdre de temps dessus.**

## Rappel des règles du projet
- `users.id` ≠ `auth.uid()`. Mapping via `users.auth_id = auth.uid()` (UUID)
- Ne JAMAIS caster `auth.uid()` en `::text`
- API routes : `createClient()` pour auth, `createServiceClient()` pour mutations (bypass RLS)
- Traductions dans les 3 fichiers (en.json, fr.json, es.json)
- `setRequestLocale(locale)` dans chaque server component
- `Array.from(new Set(...))` au lieu de `[...new Set(...)]`
- Buckets Supabase Storage : `post-images` et `user-avatars` (public, 5MB)

---

# PARTIE 1 — SUPPRIMER LE DARK MODE

L'objectif est de **retirer tout le système dark mode** pour que le site soit 100% light mode, propre et lisible.

## Étape 1 — Désactiver le darkMode dans Tailwind

**Fichier : `tailwind.config.ts`**

Modifier la ligne :
```ts
darkMode: "class",
```
En :
```ts
// darkMode désactivé — light mode uniquement
// darkMode: "class",
```

Commenter la ligne (ne pas la supprimer, pour pouvoir la réactiver plus tard si besoin).

---

## Étape 2 — Remplacer le ThemeProvider par un simple passthrough

**Fichier : `src/components/theme/ThemeProvider.tsx`**

Remplacer TOUT le contenu par :

```tsx
"use client";

import type { ReactNode } from "react";

// Dark mode désactivé temporairement — ce composant est un simple passthrough
export function useTheme() {
  return { theme: "light" as const, toggleTheme: () => {} };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

Cela permet de ne PAS casser les imports existants. Les composants qui appellent `useTheme()` recevront simplement `"light"` sans erreur.

---

## Étape 3 — Remplacer le ThemeToggle par un composant vide

**Fichier : `src/components/theme/ThemeToggle.tsx`**

Remplacer TOUT le contenu par :

```tsx
"use client";

// Dark mode désactivé temporairement — le bouton n'est plus affiché
export function ThemeToggle() {
  return null;
}
```

Le Header importe `<ThemeToggle />` — avec ce changement, il n'affichera plus rien sans erreur d'import.

---

## Étape 4 — Retirer `dark:` des classes globales du body

**Fichier : `src/app/[locale]/layout.tsx`**

Sur la ligne du `<body>`, remplacer :
```tsx
<body className="flex min-h-screen flex-col font-sans antialiased bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
```
Par :
```tsx
<body className="flex min-h-screen flex-col font-sans antialiased bg-white text-gray-900">
```

---

## Étape 5 — Retirer `dark:` des styles globaux CSS

**Fichier : `src/app/globals.css`**

Remplacer :
```css
body {
  @apply bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100;
}
```
Par :
```css
body {
  @apply bg-white text-gray-900;
}
```

---

## Étape 6 — Nettoyage rapide des `dark:` dans les fichiers critiques

**IMPORTANT** : On ne supprime PAS les classes `dark:` de TOUS les fichiers (il y en a trop, 150+, et elles ne feront rien si darkMode est désactivé dans Tailwind). On se concentre uniquement sur les fichiers où le dark mode pourrait encore interférer si la classe `dark` est toujours présente dans le HTML.

Vérifier dans **`src/app/[locale]/layout.tsx`** que le `<html>` tag n'a pas de classe `dark` ajoutée. Si le ThemeProvider a été remplacé correctement (Étape 2), aucune classe `dark` ne sera ajoutée au DOM et toutes les classes `dark:` CSS seront simplement inactives. C'est suffisant.

---

## Étape 7 — Vérifier que le MobileNav est aussi en light only

**Fichier : `src/components/layout/MobileNav.tsx`**

Vérifier que le menu mobile n'a pas de problème visuel. Ce fichier n'a pas de classes `dark:`, donc il devrait être OK. Juste confirmer visuellement.

---

## Étape 8 — Build de vérification

Lancer :
```bash
npm run build
```

Le build doit passer sans erreur TypeScript. Si une erreur TypeScript apparaît liée à `useTheme` ou `ThemeToggle`, c'est qu'un import n'est pas compatible avec le nouveau code simplifié — corriger en conséquence.

---

# PARTIE 2 — VÉRIFICATION DES NOUVELLES FEATURES

Les features suivantes ont été ajoutées dans la session précédente. Il faut vérifier que tout compile et que les fichiers sont cohérents.

## Étape 9 — Vérifier les fichiers de la feature Tags

Vérifier que ces fichiers existent et n'ont pas d'erreurs TypeScript :
- `src/lib/queries/tags.ts`
- `src/components/feed/TagDisplay.tsx`
- `src/components/feed/PopularTags.tsx`

Vérifier que `src/lib/queries/posts.ts` contient bien le join sur les tags :
```
tags:post_tags(tag:tags(id, name, slug))
```

Vérifier que `src/app/api/posts/route.ts` extrait les hashtags du contenu et crée les tags.

---

## Étape 10 — Vérifier la feature FeedToggle (All / Following)

Vérifier que ces fichiers existent :
- `src/components/feed/FeedToggle.tsx`

Vérifier que `src/app/[locale]/feed/page.tsx` :
- Importe et utilise `<FeedToggle />`
- Gère le paramètre `feed=following` dans searchParams
- Passe `followingOnly` et `followerId` à `getPosts()`

---

## Étape 11 — Vérifier la feature Commentaires améliorés

Vérifier que `src/components/feed/CommentSection.tsx` :
- Supporte les réponses imbriquées (replies à 1 niveau)
- A un bouton like sur les commentaires
- Appelle `/api/comments/[id]/like` pour les likes

Vérifier que `src/app/api/comments/[id]/like/route.ts` existe.

---

## Étape 12 — Vérifier la feature Admin

Vérifier que ces fichiers existent :
- `src/lib/queries/admin.ts`
- `src/app/api/admin/stats/route.ts`
- `src/app/api/admin/posts/route.ts`
- `src/app/api/admin/posts/[id]/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/badge/route.ts`
- `src/app/api/admin/users/[id]/role/route.ts`
- `src/app/api/badges/route.ts`
- `src/app/[locale]/admin/page.tsx`
- `src/components/admin/AdminDashboard.tsx`
- `src/components/admin/AdminLink.tsx`

Vérifier que le Header importe bien `<AdminLink />`.

---

## Étape 13 — Vérifier les traductions admin

Vérifier que `src/messages/en.json`, `fr.json`, et `es.json` contiennent tous une section `"admin"` avec les clés nécessaires.

---

## Étape 14 — Build final

```bash
npm run build
```

Le build doit passer sans erreur. Si des erreurs TypeScript apparaissent, les corriger.

---

## Migrations SQL (à exécuter manuellement par le développeur)

Les migrations suivantes doivent avoir été exécutées :
- `supabase/migrations/020_tags.sql` — Tables `tags` et `post_tags` + RLS
- `supabase/migrations/021_admin.sql` — Colonne `is_admin` sur `users`

Et après migration, exécuter manuellement :
```sql
UPDATE users SET is_admin = true WHERE email = 'squad4me.project@gmail.com';
```
