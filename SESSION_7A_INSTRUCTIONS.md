# Session 7A — Composants du Feed Social (partie 1)

## Contexte pour Claude Code

Tu travailles sur le projet Synapse dans `C:\Users\Smartlabz\OneDrive\Documents\synapse`.
Stack : Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, next-intl v3.25.
Phase 2B : on construit le feed social communautaire.
Les tables BDD sont déjà créées (posts, post_images, comments, likes, bookmarks).
Les types TypeScript et les queries Supabase sont déjà dans le projet.

**IMPORTANT : Fais chaque étape une par une. Une seule commande bash à la fois. Ne combine jamais plusieurs commandes. Attends que chaque étape soit terminée avant de passer à la suivante.**

---

## Étape 1 : Corriger un bug dans les queries (IMPORTANT)

Le fichier `src/lib/queries/posts.ts` a un bug : il référence `name` dans les JOIN Supabase mais la table `users` utilise `display_name`.

Corrige les 3 occurrences dans le fichier :

**Remplacement 1** (dans `getPosts`, ligne ~28) :
```
author:users!posts_author_id_fkey(id, name, username, avatar_url),
```
→ remplacer par :
```
author:users!posts_author_id_fkey(id, display_name, username, avatar_url),
```

**Remplacement 2** (dans `getPosts`, ligne ~30) :
```
tool:ai_tools!posts_tool_id_fkey(id, name, slug, logo_url)
```
→ pas de changement, c'est correct (ai_tools a bien `name`)

**Remplacement 3** (dans `getPostById`, ligne ~94) :
```
author:users!posts_author_id_fkey(id, name, username, avatar_url),
```
→ remplacer par :
```
author:users!posts_author_id_fkey(id, display_name, username, avatar_url),
```

**Remplacement 4** (dans `getComments`, ligne ~150) :
```
author:users!comments_author_id_fkey(id, name, username, avatar_url)
```
→ remplacer par :
```
author:users!comments_author_id_fkey(id, display_name, username, avatar_url)
```

---

## Étape 2 : Créer les API Routes pour les actions

Les boutons Like, Bookmark, Comment et Create Post sont des actions client → serveur. On a besoin de Server Actions ou de Route Handlers.

Crée le fichier `src/app/api/posts/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/posts — Créer un nouveau post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, content, prompt_content, link_url, locale } = body;

    if (!content || !category) {
      return NextResponse.json({ error: 'Content and category are required' }, { status: 400 });
    }

    // Trouver l'ID de l'utilisateur dans notre table users
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      // Fallback: chercher par email
      const { data: userByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!userByEmail) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          author_id: userByEmail.id,
          category,
          content,
          prompt_content: prompt_content || null,
          link_url: link_url || null,
          locale: locale || 'en',
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(post, { status: 201 });
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        author_id: userData.id,
        category,
        content,
        prompt_content: prompt_content || null,
        link_url: link_url || null,
        locale: locale || 'en',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

Crée le fichier `src/app/api/posts/[id]/like/route.ts` :

```typescript
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

    // Trouver l'ID utilisateur
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Vérifier si déjà liké
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userData.id)
      .eq('post_id', postId)
      .maybeSingle();

    if (existingLike) {
      // Unlike
      await supabase.from('likes').delete().eq('id', existingLike.id);
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await supabase.from('likes').insert({
        user_id: userData.id,
        post_id: postId,
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

Crée le fichier `src/app/api/posts/[id]/bookmark/route.ts` :

```typescript
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
      .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: existingBookmark } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userData.id)
      .eq('post_id', postId)
      .maybeSingle();

    if (existingBookmark) {
      await supabase.from('bookmarks').delete().eq('id', existingBookmark.id);
      return NextResponse.json({ saved: false });
    } else {
      await supabase.from('bookmarks').insert({
        user_id: userData.id,
        post_id: postId,
      });
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

Crée le fichier `src/app/api/posts/[id]/comments/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/posts/[id]/comments — Ajouter un commentaire
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

    const body = await request.json();
    const { content, parent_id } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: userData.id,
        content,
        parent_id: parent_id || null,
      })
      .select(`
        *,
        author:users!comments_author_id_fkey(id, display_name, username, avatar_url)
      `)
      .single();

    if (error) throw error;
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## Étape 3 : Créer le composant PostCard

Crée le fichier `src/components/feed/PostCard.tsx` :

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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

export function PostCard({ post }: { post: Post }) {
  const t = useTranslations("feed");
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.is_saved || false);
  const [savesCount, setSavesCount] = useState(post.saves_count);

  const author = post.author as Record<string, string | null> | undefined;
  const authorName = author?.display_name || author?.username || "Anonymous";
  const authorAvatar = author?.avatar_url;
  const authorInitial = authorName.charAt(0).toUpperCase();

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setLiked(data.liked);
      setLikesCount((prev) => (data.liked ? prev + 1 : prev - 1));
    } catch {
      // silently fail
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setSaved(data.saved);
      setSavesCount((prev) => (data.saved ? prev + 1 : prev - 1));
    } catch {
      // silently fail
    }
  };

  const copyPrompt = () => {
    if (post.prompt_content) {
      navigator.clipboard.writeText(post.prompt_content);
    }
  };

  return (
    <article className="border-b border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 sm:p-6">
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
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-xs">{categoryIcons[post.category]}</span>
            <span className="text-xs font-medium text-primary-600">
              {t(`categories.${post.category}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 pl-13">
        <p className="whitespace-pre-wrap text-gray-900">{post.content}</p>

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
            className={`flex items-center gap-1.5 text-sm transition-colors ${
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
            className={`flex items-center gap-1.5 text-sm transition-colors ${
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

---

## Étape 4 : Créer le composant PostComposer

Crée le fichier `src/components/feed/PostComposer.tsx` :

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { PostCategory } from "@/types/database";

const categories: { value: PostCategory; icon: string }[] = [
  { value: "creation", icon: "🎨" },
  { value: "prompt", icon: "💡" },
  { value: "question", icon: "❓" },
  { value: "discussion", icon: "💬" },
  { value: "tool_review", icon: "⭐" },
];

export function PostComposer({ locale, isLoggedIn }: { locale: string; isLoggedIn: boolean }) {
  const t = useTranslations("feed");
  const router = useRouter();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("discussion");
  const [promptContent, setPromptContent] = useState("");
  const [showPromptField, setShowPromptField] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkField, setShowLinkField] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="border-b border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-500">{t("composer.loginToPost")}</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          content: content.trim(),
          prompt_content: promptContent.trim() || null,
          link_url: linkUrl.trim() || null,
          locale,
        }),
      });

      if (res.ok) {
        setContent("");
        setPromptContent("");
        setLinkUrl("");
        setShowPromptField(false);
        setShowLinkField(false);
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white p-4 sm:p-6">
      {/* Category selector */}
      <div className="mb-3 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === cat.value
                ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{cat.icon}</span>
            {t(`categories.${cat.value}`)}
          </button>
        ))}
      </div>

      {/* Text area */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("composer.placeholder")}
        rows={3}
        className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      {/* Prompt field */}
      {showPromptField && (
        <textarea
          value={promptContent}
          onChange={(e) => setPromptContent(e.target.value)}
          placeholder={t("composer.promptPlaceholder")}
          rows={3}
          className="mt-2 w-full resize-none rounded-lg border border-primary-200 bg-primary-50 p-3 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      )}

      {/* Link field */}
      {showLinkField && (
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder={t("composer.linkPlaceholder")}
          className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      )}

      {/* Action bar */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setShowPromptField(!showPromptField)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showPromptField
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            💡 {t("composer.addPrompt")}
          </button>
          <button
            onClick={() => setShowLinkField(!showLinkField)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showLinkField
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            🔗 {t("composer.addLink")}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t("composer.publishing") : t("composer.publish")}
        </button>
      </div>
    </div>
  );
}
```

---

## Étape 5 : Créer le composant CategoryFilter

Crée le fichier `src/components/feed/CategoryFilter.tsx` :

```tsx
"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import type { PostCategory } from "@/types/database";

const categoryOptions: { value: string; icon: string }[] = [
  { value: "all", icon: "📋" },
  { value: "creation", icon: "🎨" },
  { value: "prompt", icon: "💡" },
  { value: "question", icon: "❓" },
  { value: "discussion", icon: "💬" },
  { value: "tool_review", icon: "⭐" },
];

export function CategoryFilter() {
  const t = useTranslations("feed");
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";

  const handleFilter = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat === "all") {
      params.delete("category");
    } else {
      params.set("category", cat);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
      {categoryOptions.map((cat) => (
        <button
          key={cat.value}
          onClick={() => handleFilter(cat.value)}
          className={`flex-shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
            currentCategory === cat.value
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <span>{cat.icon}</span>
          {t(`categories.${cat.value}`)}
        </button>
      ))}
    </div>
  );
}
```

---

## Étape 6 : Créer la page Feed

Crée le dossier et le fichier `src/app/[locale]/feed/page.tsx` :

```tsx
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getPosts } from "@/lib/queries/posts";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { CategoryFilter } from "@/components/feed/CategoryFilter";
import type { PostCategory } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feed" });

  return generatePageMetadata({
    title: t("title"),
    description: "Community feed — share AI creations, prompts, and discussions.",
    locale,
    path: "/feed",
  });
}

export default async function FeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "feed" });

  // Check if user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userId: string | undefined;
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
      .single();
    userId = userData?.id;
  }

  const category = search.category as PostCategory | undefined;
  const page = parseInt(search.page || "1", 10);

  let postsData = { posts: [] as Awaited<ReturnType<typeof getPosts>>["posts"], total: 0 };
  try {
    postsData = await getPosts({ page, category, userId });
  } catch {
    // fail gracefully
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="max-w-2xl py-0 sm:py-4">
        <div className="overflow-hidden bg-white shadow sm:rounded-xl">
          {/* Composer */}
          <PostComposer locale={locale} isLoggedIn={!!user} />

          {/* Category Filter */}
          <Suspense fallback={null}>
            <CategoryFilter />
          </Suspense>

          {/* Posts Feed */}
          {postsData.posts.length > 0 ? (
            <div>
              {postsData.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-medium text-gray-900">{t("empty.title")}</p>
              <p className="mt-1 text-sm text-gray-500">
                {category ? t("empty.filtered") : t("empty.description")}
              </p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
```

---

## Étape 7 : Ajouter "Community" dans la navigation

Modifie `src/components/layout/Header.tsx` pour ajouter un lien "Community" dans la nav.

Dans le tableau `links`, ajoute un nouvel élément **entre "home" et "articles"** :

```typescript
const links = [
  { href: "/", label: t("home") },
  { href: "/feed", label: t("community") },
  { href: "/articles", label: t("articles") },
  { href: "/tools", label: t("tools") },
  { href: "/about", label: t("about") },
] as const;
```

Puis ajoute la clé de traduction `"community"` dans les 3 fichiers de messages :

- `en.json` → dans "navigation" : `"community": "Community"`
- `fr.json` → dans "navigation" : `"community": "Communauté"`
- `es.json` → dans "navigation" : `"community": "Comunidad"`

---

## Étape 8 : Commit Git

```
git add -A
```

Message de commit :
```
Add community feed: PostCard, PostComposer, CategoryFilter, API routes, feed page

Session 7A: Feed social UI components
- PostCard with like, bookmark, prompt copy, image grid
- PostComposer with category selection, prompt/link fields
- CategoryFilter with active state
- API routes: create post, toggle like, toggle bookmark, add comment
- Feed page at /[locale]/feed with auth-aware rendering
- Navigation updated with Community link
- Fix: queries now use display_name instead of name for users
```

---

## Ne PAS pousser encore

On fera le push après la Session 7B (redesign homepage). Dis-moi quand c'est terminé.
