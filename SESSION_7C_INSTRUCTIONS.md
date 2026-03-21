# SESSION 7C — Bug Fixes + Améliorations Feed

## 3 problèmes à corriger :
1. **Bug critique** : Like/Bookmark ne font pas de toggle (le compteur monte à chaque clic sans jamais redescendre)
2. **Visuel** : Pas assez de séparation visuelle entre les posts du feed
3. **Feature** : Ajouter un badge de langue + bouton "Traduire" sur les posts dans une autre langue

## IMPORTANT — Règles pour Claude Code
- Fais chaque étape **une par une**, dans l'ordre
- Ne combine PAS plusieurs commandes bash sur la même ligne
- Après chaque fichier modifié, vérifie la compilation : `npx tsc --noEmit --pretty 2>&1 | head -30`
- La table users utilise `display_name` (PAS `name`)

---

## Étape 1 : Comprendre le bug Like/Bookmark

**Cause racine** : Les policies RLS sur les tables `likes` et `bookmarks` comparent `auth.uid()` avec `user_id`. Mais `user_id` dans ces tables contient `users.id` (UUID interne auto-généré), alors que `auth.uid()` retourne l'ID d'authentification Supabase (stocké dans `users.auth_id`). Ces deux UUID sont **différents**.

Conséquence :
- L'INSERT dans likes échoue silencieusement (RLS bloque)
- Le DELETE échoue aussi silencieusement
- Le code API ne vérifie pas les erreurs et retourne `{ liked: true }` à chaque clic
- Le client incrémente le compteur à chaque clic

**Solution** : Modifier les policies RLS pour faire un lookup via la table `users`, et ajouter une vérification d'erreur dans les API routes + un loading guard dans PostCard.

---

## Étape 2 : Créer la migration SQL 009 pour corriger les RLS

Créer le fichier `supabase/migrations/009_fix_likes_bookmarks_rls.sql` :

```sql
-- ============================================================
-- Migration 009: Fix RLS policies for likes and bookmarks
-- Problem: auth.uid() != users.id (users.auth_id = auth.uid())
-- Solution: Use subquery to check via users.auth_id
-- ============================================================

-- Also fix the likes_count/saves_count that got inflated during testing
-- Reset counters based on actual data
UPDATE posts SET
  likes_count = (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id),
  saves_count = (SELECT COUNT(*) FROM bookmarks WHERE bookmarks.post_id = posts.id),
  comments_count = (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id);

-- ============================================================
-- Fix LIKES RLS policies
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can like" ON likes;
DROP POLICY IF EXISTS "Users can unlike" ON likes;

-- New INSERT policy: user_id must match a users row where auth_id = auth.uid()
CREATE POLICY "Users can like"
  ON likes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_id
      AND users.auth_id = auth.uid()
    )
  );

-- New DELETE policy: same check
CREATE POLICY "Users can unlike"
  ON likes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_id
      AND users.auth_id = auth.uid()
    )
  );

-- ============================================================
-- Fix BOOKMARKS RLS policies
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can create bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;

-- New SELECT policy
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_id
      AND users.auth_id = auth.uid()
    )
  );

-- New INSERT policy
CREATE POLICY "Users can create bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_id
      AND users.auth_id = auth.uid()
    )
  );

-- New DELETE policy
CREATE POLICY "Users can delete bookmarks"
  ON bookmarks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_id
      AND users.auth_id = auth.uid()
    )
  );
```

**IMPORTANT** : Après avoir créé ce fichier, **copie tout le contenu SQL** et exécute-le dans le **Supabase SQL Editor** (https://bgfrpoyscadnvthnghfw.supabase.co → SQL Editor → New query → coller → Run). La migration doit être exécutée manuellement dans Supabase car on n'utilise pas la CLI Supabase pour les migrations.

Affiche le SQL à l'écran pour que l'utilisateur puisse le copier.

---

## Étape 3 : Corriger les API routes — ajouter la vérification d'erreur

### 3a. Corriger `src/app/api/posts/[id]/like/route.ts`

Remplacer **tout le contenu** par :

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/posts/[id]/like — Toggle like sur un post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trouver l'ID utilisateur interne
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single() as { data: { id: string } | null };

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Vérifier si déjà liké
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userData.id)
      .eq('post_id', postId)
      .maybeSingle() as { data: { id: string } | null };

    if (existingLike) {
      // Unlike — supprimer le like
      const { error: deleteError } = await (supabase.from('likes') as any).delete().eq('id', existingLike.id);
      if (deleteError) {
        console.error('Error deleting like:', deleteError);
        return NextResponse.json({ error: 'Failed to unlike' }, { status: 500 });
      }
      return NextResponse.json({ liked: false });
    } else {
      // Like — créer le like
      const { error: insertError } = await (supabase.from('likes') as any).insert({
        user_id: userData.id,
        post_id: postId,
      });
      if (insertError) {
        console.error('Error inserting like:', insertError);
        return NextResponse.json({ error: 'Failed to like' }, { status: 500 });
      }
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 3b. Corriger `src/app/api/posts/[id]/bookmark/route.ts`

Remplacer **tout le contenu** par :

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/posts/[id]/bookmark — Toggle bookmark sur un post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single() as { data: { id: string } | null };

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: existingBookmark } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userData.id)
      .eq('post_id', postId)
      .maybeSingle() as { data: { id: string } | null };

    if (existingBookmark) {
      const { error: deleteError } = await (supabase.from('bookmarks') as any).delete().eq('id', existingBookmark.id);
      if (deleteError) {
        console.error('Error deleting bookmark:', deleteError);
        return NextResponse.json({ error: 'Failed to unsave' }, { status: 500 });
      }
      return NextResponse.json({ saved: false });
    } else {
      const { error: insertError } = await (supabase.from('bookmarks') as any).insert({
        user_id: userData.id,
        post_id: postId,
      });
      if (insertError) {
        console.error('Error inserting bookmark:', insertError);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
      }
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

Après les 2 fichiers, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 4 : Corriger PostCard — loading guard + séparation visuelle + badge langue + bouton traduire

Remplacer **tout le contenu** de `src/components/feed/PostCard.tsx` par :

```tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Post } from "@/types/database";

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString();
}

const categoryIcons: Record<string, string> = {
  creation: "🎨",
  prompt: "💡",
  question: "❓",
  discussion: "💬",
  tool_review: "⭐",
};

const langNames: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
};

export function PostCard({ post }: { post: Post }) {
  const t = useTranslations("feed");
  const currentLocale = useLocale();
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.is_saved || false);
  const [savesCount, setSavesCount] = useState(post.saves_count);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const author = post.author as Record<string, string | null> | undefined;
  const authorName = author?.display_name || author?.username || "Anonymous";
  const authorAvatar = author?.avatar_url;
  const authorInitial = authorName.charAt(0).toUpperCase();

  const isOtherLanguage = post.locale !== currentLocale;

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.error) return;
      setLiked(data.liked);
      setLikesCount((prev) => (data.liked ? prev + 1 : prev - 1));
    } catch {
      // silently fail
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSave = async () => {
    if (saveLoading) return;
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.error) return;
      setSaved(data.saved);
      setSavesCount((prev) => (data.saved ? prev + 1 : prev - 1));
    } catch {
      // silently fail
    } finally {
      setSaveLoading(false);
    }
  };

  const copyPrompt = () => {
    if (post.prompt_content) {
      navigator.clipboard.writeText(post.prompt_content);
    }
  };

  const handleTranslate = () => {
    const text = encodeURIComponent(post.content);
    const url = `https://translate.google.com/?sl=${post.locale}&tl=${currentLocale}&text=${text}&op=translate`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="border-b border-gray-200 bg-white p-4 sm:p-6">
      {/* Header: Avatar + Author + Category + Time */}
      <div className="flex items-start gap-3">
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt={authorName}
            className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
            {authorInitial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{authorName}</span>
            {author?.username && (
              <span className="text-sm text-gray-500">@{author.username}</span>
            )}
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{timeAgo(post.created_at)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs">{categoryIcons[post.category]}</span>
            <span className="text-xs font-medium text-primary-600">
              {t(`categories.${post.category}`)}
            </span>
            {/* Language badge */}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-500">
              {post.locale}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 pl-13">
        <p className="whitespace-pre-wrap text-gray-900">{post.content}</p>

        {/* Translate button (if post is in another language) */}
        {isOtherLanguage && (
          <button
            onClick={handleTranslate}
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            🌐 {t("post.translate", { lang: langNames[currentLocale] || currentLocale })}
          </button>
        )}

        {/* Prompt block */}
        {post.prompt_content && (
          <div className="mt-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-primary-700">Prompt</span>
              <button
                onClick={copyPrompt}
                className="rounded px-2 py-0.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-100"
              >
                {t("post.copyPrompt")}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-gray-800">
              {post.prompt_content}
            </pre>
          </div>
        )}

        {/* Link preview */}
        {post.link_url && (
          <a
            href={post.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block overflow-hidden rounded-lg border border-gray-200 transition-colors hover:bg-gray-50"
          >
            <div className="p-3">
              <p className="text-sm font-medium text-primary-600 hover:underline">
                {post.link_url}
              </p>
            </div>
          </a>
        )}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div
            className={`mt-3 grid gap-1 overflow-hidden rounded-xl border border-gray-200 ${
              post.images.length === 1
                ? "grid-cols-1"
                : post.images.length === 2
                ? "grid-cols-2"
                : post.images.length === 3
                ? "grid-cols-2"
                : "grid-cols-2"
            }`}
          >
            {post.images.slice(0, 4).map((image, idx) => (
              <img
                key={image.id}
                src={image.image_url}
                alt={image.alt_text || `Image ${idx + 1}`}
                className={`w-full object-cover ${
                  post.images!.length === 1 ? "max-h-96" : "h-48"
                } ${post.images!.length === 3 && idx === 0 ? "row-span-2 h-full" : ""}`}
              />
            ))}
          </div>
        )}

        {/* Actions: Like, Comment, Save */}
        <div className="mt-3 flex items-center gap-6">
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 ${
              liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            }`}
          >
            <span>{liked ? "❤️" : "🤍"}</span>
            <span>{likesCount > 0 ? likesCount : ""}</span>
          </button>

          <button className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary-600">
            <span>💬</span>
            <span>{post.comments_count > 0 ? post.comments_count : ""}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saveLoading}
            className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 ${
              saved ? "text-primary-600" : "text-gray-500 hover:text-primary-600"
            }`}
          >
            <span>{saved ? "🔖" : "📑"}</span>
            <span>{savesCount > 0 ? savesCount : ""}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
```

Après modification, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 5 : Améliorer la séparation visuelle dans la page feed et la homepage

### 5a. Modifier `src/app/[locale]/feed/page.tsx`

Dans la section qui affiche les posts (la div qui contient le map), ajouter un espacement entre les posts. Trouver :

```tsx
{postsData.posts.map((post) => (
  <PostCard key={post.id} post={post} />
))}
```

Remplacer par :

```tsx
{postsData.posts.map((post) => (
  <PostCard key={post.id} post={post} />
))}
```

En fait la séparation vient déjà du `border-b` dans PostCard. On va plutôt ajouter un léger espacement vertical entre les posts.

Trouver la div parente qui contient le map des posts :
```tsx
<div>
  {postsData.posts.map((post) => (
```

Remplacer par :
```tsx
<div className="divide-y divide-gray-200">
  {postsData.posts.map((post) => (
```

### 5b. Même chose dans `src/components/home/HomeFeed.tsx`

Trouver :
```tsx
<div>
  {posts.map((post) => (
```

Remplacer par :
```tsx
<div className="divide-y divide-gray-200">
  {posts.map((post) => (
```

Après modifications, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 6 : Ajouter les traductions manquantes

Dans les 3 fichiers de traduction, ajouter la clé `post.translate` dans le namespace `"feed"`.

### `src/messages/en.json` — dans le namespace `"feed"` > `"post"` :

Ajouter cette clé dans l'objet `"post"` :
```json
"translate": "Translate to {lang}"
```

### `src/messages/fr.json` — dans le namespace `"feed"` > `"post"` :

```json
"translate": "Traduire en {lang}"
```

### `src/messages/es.json` — dans le namespace `"feed"` > `"post"` :

```json
"translate": "Traducir a {lang}"
```

**NOTE** : Vérifie d'abord la structure existante du namespace `"feed"` dans chaque fichier pour trouver le bon endroit. L'objet `"post"` existe déjà et contient `"copyPrompt"`. Ajoute `"translate"` au même niveau.

Après modifications, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 7 : Vérification TypeScript complète

```bash
npx tsc --noEmit --pretty
```

S'il y a des erreurs :
- Si `useLocale` n'est pas reconnu : c'est un export de `next-intl`, vérifie l'import
- Si le type du paramètre `lang` dans la traduction pose problème, on peut simplifier avec une string template

---

## Étape 8 : Build

```bash
npm run build 2>&1 | tail -40
```

Corriger les erreurs si nécessaire.

---

## Étape 9 : Commit + Push

```bash
git add supabase/migrations/009_fix_likes_bookmarks_rls.sql
git add src/app/api/posts/[id]/like/route.ts
git add src/app/api/posts/[id]/bookmark/route.ts
git add src/components/feed/PostCard.tsx
git add src/app/[locale]/feed/page.tsx
git add src/components/home/HomeFeed.tsx
git add src/messages/en.json
git add src/messages/fr.json
git add src/messages/es.json
```

Puis commiter :

```bash
git commit -m "Fix like/bookmark toggle, add post separation, add language badge and translate button

Session 7C: Bug fixes and feed improvements
- Fix RLS policies on likes/bookmarks (auth.uid vs users.id mismatch)
- Add error checking in like/bookmark API routes
- Add loading guard to prevent rapid double-clicks on like/save
- Add visual separation between posts (divide-y)
- Add language badge (EN/FR/ES) on each post
- Add 'Translate' button for posts in different language (opens Google Translate)
- Reset inflated counters via migration 009
- Add i18n translations for translate button"
```

Puis push :

```bash
git push origin main
```

---

## Étape 10 : RAPPEL IMPORTANT — Exécuter la migration SQL

Après le push, rappeler à l'utilisateur qu'il doit exécuter la migration 009 dans Supabase SQL Editor. Afficher le SQL complet à copier-coller.

Sans cette migration exécutée dans Supabase, les likes/bookmarks ne fonctionneront toujours pas correctement.
