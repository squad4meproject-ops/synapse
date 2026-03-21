# SESSION 7D PARTIE 1 — Corrections UI du Feed

## 5 problèmes à corriger :
1. **Like/Bookmark toggle cassé** — Le toggle ne fonctionne toujours pas (RLS bloque encore). Solution : utiliser un client service_role pour les mutations.
2. **Icônes moches** — Remplacer les emoji like/comment/save par des SVG propres
3. **Traduction inline** — Traduire directement dans le post au lieu d'ouvrir Google Translate
4. **Espace entre les posts** — Plus de séparation visuelle (cards individuelles)
5. **Commentaires** — Le bouton commentaire doit ouvrir une section de commentaires fonctionnelle

## IMPORTANT — Règles pour Claude Code
- Fais chaque étape **une par une**, dans l'ordre
- Ne combine PAS plusieurs commandes bash sur la même ligne
- Après chaque fichier modifié, vérifie la compilation : `npx tsc --noEmit --pretty 2>&1 | head -30`
- La table users utilise `display_name` (PAS `name`)

---

## Étape 1 : Créer un client Supabase service_role

Le client `service_role` ignore les règles RLS. On l'utilise uniquement dans les API routes côté serveur, après avoir vérifié que l'utilisateur est bien authentifié.

Créer le fichier `src/lib/supabase/service.ts` :

```ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Client avec la clé service_role — BYPASS RLS
// Utiliser UNIQUEMENT dans les API routes serveur, APRÈS vérification auth
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

Après création, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 2 : Corriger l'API route Like avec le service client

Remplacer **tout le contenu** de `src/app/api/posts/[id]/like/route.ts` par :

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    // 1. Vérifier l'auth avec le client normal (cookies)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Utiliser le service client pour les mutations (bypass RLS)
    const service = createServiceClient();

    // 3. Trouver l'utilisateur interne
    const { data: userData } = await service
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Vérifier si déjà liké
    const { data: existingLike } = await service
      .from('likes')
      .select('id')
      .eq('user_id', userData.id)
      .eq('post_id', postId)
      .maybeSingle();

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await service
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Error deleting like:', deleteError);
        return NextResponse.json({ error: 'Failed to unlike' }, { status: 500 });
      }
      return NextResponse.json({ liked: false });
    } else {
      // Like
      const { error: insertError } = await service
        .from('likes')
        .insert({ user_id: userData.id, post_id: postId });

      if (insertError) {
        // Si déjà liké (constraint unique), traiter comme un unlike
        if (insertError.code === '23505') {
          await service.from('likes').delete()
            .eq('user_id', userData.id)
            .eq('post_id', postId);
          return NextResponse.json({ liked: false });
        }
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

Après modification, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 3 : Corriger l'API route Bookmark avec le service client

Remplacer **tout le contenu** de `src/app/api/posts/[id]/bookmark/route.ts` par :

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

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

    const service = createServiceClient();

    const { data: userData } = await service
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: existingBookmark } = await service
      .from('bookmarks')
      .select('id')
      .eq('user_id', userData.id)
      .eq('post_id', postId)
      .maybeSingle();

    if (existingBookmark) {
      const { error: deleteError } = await service
        .from('bookmarks')
        .delete()
        .eq('id', existingBookmark.id);

      if (deleteError) {
        console.error('Error deleting bookmark:', deleteError);
        return NextResponse.json({ error: 'Failed to unsave' }, { status: 500 });
      }
      return NextResponse.json({ saved: false });
    } else {
      const { error: insertError } = await service
        .from('bookmarks')
        .insert({ user_id: userData.id, post_id: postId });

      if (insertError) {
        if (insertError.code === '23505') {
          await service.from('bookmarks').delete()
            .eq('user_id', userData.id)
            .eq('post_id', postId);
          return NextResponse.json({ saved: false });
        }
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

Après modification, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 4 : Corriger l'API route Comments avec le service client

Remplacer **tout le contenu** de `src/app/api/posts/[id]/comments/route.ts` par :

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/posts/[id]/comments — Récupérer les commentaires
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const service = createServiceClient();

    const { data, error } = await service
      .from('comments')
      .select(`
        *,
        author:users!comments_author_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json([], { status: 500 });
  }
}

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

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const service = createServiceClient();

    const { data: userData } = await service
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: comment, error } = await service
      .from('comments')
      .insert({
        post_id: postId,
        author_id: userData.id,
        content: content.trim(),
        parent_id: parent_id || null,
      })
      .select(`
        *,
        author:users!comments_author_id_fkey(id, display_name, username, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to comment' }, { status: 500 });
    }
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

Après modification, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 5 : Créer l'API route de traduction

Créer `src/app/api/translate/route.ts` :

```ts
import { NextRequest, NextResponse } from 'next/server';

// POST /api/translate — Traduire du texte via MyMemory API (gratuit, pas de clé)
export async function POST(request: NextRequest) {
  try {
    const { text, from, to } = await request.json();

    if (!text || !from || !to) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Limiter à 500 caractères pour rester dans les limites gratuites
    const trimmedText = text.slice(0, 500);

    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmedText)}&langpair=${from}|${to}`;

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'Translation failed' }, { status: 502 });
    }

    const data = await res.json();
    const translated = data?.responseData?.translatedText;

    if (!translated) {
      return NextResponse.json({ error: 'No translation' }, { status: 502 });
    }

    return NextResponse.json({ translated });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
```

Après création, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 6 : Créer le composant CommentSection

Créer `src/components/feed/CommentSection.tsx` :

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function CommentSection({
  postId,
  isLoggedIn,
  initialCount,
}: {
  postId: string;
  isLoggedIn: boolean;
  initialCount: number;
}) {
  const t = useTranslations("feed");
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (isOpen && comments.length === 0) {
      loadComments();
    }
  }, [isOpen]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
        setCount((c) => c + 1);
      }
    } catch {
      // fail silently
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
        </svg>
        <span>{count > 0 ? count : ""}</span>
      </button>

      {/* Comments panel */}
      {isOpen && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50">
          {/* Comment input */}
          {isLoggedIn ? (
            <div className="flex gap-2 border-b border-gray-200 p-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={t("comments.placeholder")}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
                className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? "..." : t("comments.reply")}
              </button>
            </div>
          ) : (
            <div className="border-b border-gray-200 p-3 text-center text-xs text-gray-500">
              {t("comments.loginToComment")}
            </div>
          )}

          {/* Comments list */}
          {loading ? (
            <div className="p-4 text-center text-xs text-gray-400">Loading...</div>
          ) : comments.length > 0 ? (
            <div className="max-h-64 divide-y divide-gray-200 overflow-y-auto">
              {comments.map((comment) => {
                const name = comment.author?.display_name || comment.author?.username || "Anonymous";
                const avatar = comment.author?.avatar_url;
                return (
                  <div key={comment.id} className="flex gap-2 p-3">
                    {avatar ? (
                      <img src={avatar} alt={name} className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900">{name}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(comment.created_at)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-400">{t("empty.title")}</div>
          )}
        </div>
      )}
    </div>
  );
}
```

Après création, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 7 : Réécrire PostCard avec SVG, espacement, traduction inline, et commentaires

C'est l'étape la plus grosse. Remplacer **tout le contenu** de `src/components/feed/PostCard.tsx` par :

```tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CommentSection } from "./CommentSection";
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

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg className="h-5 w-5 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
  );
}

export function PostCard({ post, isLoggedIn = false }: { post: Post; isLoggedIn?: boolean }) {
  const t = useTranslations("feed");
  const currentLocale = useLocale();
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.is_saved || false);
  const [savesCount, setSavesCount] = useState(post.saves_count);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

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

  const handleTranslate = async () => {
    if (translating) return;
    if (translatedText) {
      setTranslatedText(null);
      return;
    }
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: post.content,
          from: post.locale,
          to: currentLocale,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslatedText(data.translated);
      }
    } catch {
      // fail silently
    } finally {
      setTranslating(false);
    }
  };

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        {authorAvatar ? (
          <img src={authorAvatar} alt={authorName} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
            {authorInitial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{authorName}</span>
            {author?.username && <span className="text-sm text-gray-500">@{author.username}</span>}
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{timeAgo(post.created_at)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs">{categoryIcons[post.category]}</span>
            <span className="text-xs font-medium text-primary-600">{t(`categories.${post.category}`)}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-500">{post.locale}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 pl-13">
        <p className="whitespace-pre-wrap text-gray-900">{post.content}</p>

        {/* Translated text (inline) */}
        {translatedText && (
          <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-blue-600">
                🌐 {langNames[currentLocale] || currentLocale}
              </span>
              <button onClick={() => setTranslatedText(null)} className="text-[10px] text-blue-500 hover:underline">✕</button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-800">{translatedText}</p>
          </div>
        )}

        {/* Translate button */}
        {isOtherLanguage && (
          <button
            onClick={handleTranslate}
            disabled={translating}
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
          >
            🌐 {translating ? "..." : translatedText ? t("post.translate", { lang: langNames[post.locale] || post.locale }) : t("post.translate", { lang: langNames[currentLocale] || currentLocale })}
          </button>
        )}

        {/* Prompt block */}
        {post.prompt_content && (
          <div className="mt-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-primary-700">Prompt</span>
              <button onClick={copyPrompt} className="rounded px-2 py-0.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-100">
                {t("post.copyPrompt")}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-gray-800">{post.prompt_content}</pre>
          </div>
        )}

        {/* Link preview */}
        {post.link_url && (
          <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-lg border border-gray-200 transition-colors hover:bg-gray-50">
            <div className="p-3">
              <p className="text-sm font-medium text-primary-600 hover:underline">{post.link_url}</p>
            </div>
          </a>
        )}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className={`mt-3 grid gap-1 overflow-hidden rounded-xl border border-gray-200 ${
            post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}>
            {post.images.slice(0, 4).map((image, idx) => (
              <img key={image.id} src={image.image_url} alt={image.alt_text || `Image ${idx + 1}`}
                className={`w-full object-cover ${post.images!.length === 1 ? "max-h-96" : "h-48"} ${post.images!.length === 3 && idx === 0 ? "row-span-2 h-full" : ""}`} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-6">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-1.5 transition-colors disabled:opacity-50 ${liked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
          >
            <HeartIcon filled={liked} />
            <span className="text-sm font-medium">{likesCount > 0 ? likesCount : ""}</span>
          </button>

          {/* Comment */}
          <CommentSection postId={post.id} isLoggedIn={isLoggedIn} initialCount={post.comments_count} />

          {/* Bookmark */}
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className={`flex items-center gap-1.5 transition-colors disabled:opacity-50 ${saved ? "text-primary-600" : "text-gray-400 hover:text-primary-600"}`}
          >
            <BookmarkIcon filled={saved} />
            <span className="text-sm font-medium">{savesCount > 0 ? savesCount : ""}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
```

**IMPORTANT** : PostCard accepte maintenant une prop `isLoggedIn`. Il faut la passer depuis les composants parents.

Après modification, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 8 : Passer `isLoggedIn` aux PostCards

### 8a. Modifier `src/app/[locale]/feed/page.tsx`

Trouver :
```tsx
<PostCard key={post.id} post={post} />
```

Remplacer par :
```tsx
<PostCard key={post.id} post={post} isLoggedIn={!!user} />
```

### 8b. Modifier `src/components/home/HomeFeed.tsx`

Trouver :
```tsx
<PostCard key={post.id} post={post} />
```

Remplacer par :
```tsx
<PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} />
```

### 8c. Modifier la liste des posts dans HomeFeed.tsx pour ajouter de l'espacement

Trouver :
```tsx
<div className="divide-y divide-gray-200">
  {posts.map((post) => (
    <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} />
  ))}
</div>
```

Remplacer par :
```tsx
<div className="space-y-4 p-4">
  {posts.map((post) => (
    <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} />
  ))}
</div>
```

### 8d. Modifier la liste des posts dans feed/page.tsx pour ajouter de l'espacement

Trouver :
```tsx
<div className="divide-y divide-gray-200">
  {postsData.posts.map((post) => (
    <PostCard key={post.id} post={post} isLoggedIn={!!user} />
  ))}
</div>
```

Remplacer par :
```tsx
<div className="space-y-4 p-4">
  {postsData.posts.map((post) => (
    <PostCard key={post.id} post={post} isLoggedIn={!!user} />
  ))}
</div>
```

Après modifications, lancer : `npx tsc --noEmit --pretty 2>&1 | head -30`

---

## Étape 9 : Vérification TypeScript complète et Build

```bash
npx tsc --noEmit --pretty
```

S'il y a des erreurs, les corriger.

Puis :

```bash
npm run build 2>&1 | tail -40
```

---

## Étape 10 : Commit (PAS de push, attendre la Partie 2)

```bash
git add src/lib/supabase/service.ts
git add src/app/api/posts/[id]/like/route.ts
git add src/app/api/posts/[id]/bookmark/route.ts
git add src/app/api/posts/[id]/comments/route.ts
git add src/app/api/translate/route.ts
git add src/components/feed/CommentSection.tsx
git add src/components/feed/PostCard.tsx
git add src/components/home/HomeFeed.tsx
git add src/app/[locale]/feed/page.tsx
```

```bash
git commit -m "Fix like/bookmark with service client, add SVG icons, inline translation, comments, card spacing

Session 7D Part 1: Feed UI improvements
- Use service_role client for like/bookmark/comment mutations (bypass RLS)
- Replace emoji icons with proper SVG heart/bookmark icons
- Add inline translation via MyMemory API (free, no key needed)
- Add CommentSection component with real-time comment posting
- Individual post cards with rounded borders and shadows
- Space between posts for better visual separation
- Pass isLoggedIn prop to PostCard for comment section"
```

**NE PAS PUSH** — attendre la Partie 2.
