# SESSION 8B — Transformer Synapse en vrai réseau social

## CONTEXTE
Le site ressemble trop à un blog. On va ajouter les fonctionnalités qui font la différence : upload d'images, profils publics cliquables, suppression de posts, et pagination du feed.

**IMPORTANT** : Fais les étapes UNE PAR UNE, dans l'ordre. Attends ma confirmation entre chaque étape.

---

## ÉTAPE 1 : Créer le bucket Supabase Storage (MANUEL — pas dans Claude Code)

⚠️ **CETTE ÉTAPE EST FAITE PAR BENJAMIN DANS LE DASHBOARD SUPABASE** ⚠️

Aller sur https://bgfrpoyscadnvthnghfw.supabase.co → Storage → "New bucket" :
- **Name** : `post-images`
- **Public** : ✅ OUI (les images doivent être accessibles publiquement)
- **File size limit** : 5 MB
- **Allowed MIME types** : `image/jpeg, image/png, image/gif, image/webp`

Puis aller dans l'onglet **Policies** du bucket `post-images` et créer ces policies :

**Policy 1 — SELECT (tout le monde peut voir)** :
- Policy name : `Public read access`
- Allowed operation : SELECT
- Target roles : (laisser vide = tous)
- Policy : `true`

**Policy 2 — INSERT (users connectés)** :
- Policy name : `Authenticated users can upload`
- Allowed operation : INSERT
- Target roles : `authenticated`
- Policy : `true`

**Policy 3 — DELETE (propriétaire seulement)** :
- Policy name : `Users can delete own images`
- Allowed operation : DELETE
- Target roles : `authenticated`
- Policy : `(auth.uid())::text = (storage.foldername(name))[1]`

(On va organiser les fichiers en `{user_auth_id}/{filename}` pour que cette policy fonctionne.)

**Quand c'est fait, dis "OK" à Claude Code pour passer à l'étape 2.**

---

## ÉTAPE 2 : API route pour l'upload d'images

Créer le fichier `src/app/api/upload/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Lire le fichier du FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Vérifier le type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Vérifier la taille (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // 3. Upload vers Supabase Storage
    const serviceClient = createServiceClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await serviceClient.storage
      .from('post-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // 4. Construire l'URL publique
    const { data: { publicUrl } } = serviceClient.storage
      .from('post-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## ÉTAPE 3 : Modifier le PostComposer pour supporter l'upload d'images

Modifier `src/components/feed/PostComposer.tsx` :

### Changements à faire :

1. Ajouter ces états après les états existants :
```typescript
const [images, setImages] = useState<File[]>([]);
const [imagePreviews, setImagePreviews] = useState<string[]>([]);
const [uploading, setUploading] = useState(false);
```

2. Ajouter un ref pour l'input file :
```typescript
import { useState, useRef } from "react";
// ...
const fileInputRef = useRef<HTMLInputElement>(null);
```

3. Ajouter la fonction de gestion des images :
```typescript
const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  const maxImages = 4;
  const remaining = maxImages - images.length;
  const newFiles = files.slice(0, remaining);

  if (newFiles.length === 0) return;

  setImages(prev => [...prev, ...newFiles]);

  // Créer les previews
  newFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviews(prev => [...prev, e.target?.result as string]);
    };
    reader.readAsDataURL(file);
  });

  // Reset l'input
  if (fileInputRef.current) fileInputRef.current.value = '';
};

const removeImage = (index: number) => {
  setImages(prev => prev.filter((_, i) => i !== index));
  setImagePreviews(prev => prev.filter((_, i) => i !== index));
};
```

4. Modifier la fonction `handleSubmit` pour uploader les images AVANT de créer le post :
```typescript
const handleSubmit = async () => {
  if (!content.trim() || submitting) return;
  setSubmitting(true);

  try {
    // Upload des images d'abord
    let imageUrls: string[] = [];
    if (images.length > 0) {
      setUploading(true);
      const uploadPromises = images.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          return data.url;
        }
        return null;
      });
      const results = await Promise.all(uploadPromises);
      imageUrls = results.filter(Boolean) as string[];
      setUploading(false);
    }

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        content: content.trim(),
        prompt_content: promptContent.trim() || null,
        link_url: linkUrl.trim() || null,
        locale,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      }),
    });

    if (res.ok) {
      setContent("");
      setPromptContent("");
      setLinkUrl("");
      setShowPromptField(false);
      setShowLinkField(false);
      setImages([]);
      setImagePreviews([]);
      router.refresh();
    }
  } catch {
    // silently fail
  } finally {
    setSubmitting(false);
    setUploading(false);
  }
};
```

5. Ajouter l'input file caché et les previews d'images APRÈS le textarea principal et avant le champ prompt :
```tsx
{/* Hidden file input */}
<input
  ref={fileInputRef}
  type="file"
  accept="image/jpeg,image/png,image/gif,image/webp"
  multiple
  onChange={handleImageSelect}
  className="hidden"
/>

{/* Image previews */}
{imagePreviews.length > 0 && (
  <div className="mt-2 flex flex-wrap gap-2">
    {imagePreviews.map((preview, index) => (
      <div key={index} className="group relative">
        <img
          src={preview}
          alt={`Preview ${index + 1}`}
          className="h-20 w-20 rounded-lg object-cover"
        />
        <button
          type="button"
          onClick={() => removeImage(index)}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
        >
          x
        </button>
      </div>
    ))}
  </div>
)}
```

6. Ajouter un bouton "Add images" dans la barre d'actions (à côté des boutons prompt et link) :
```tsx
<button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  disabled={images.length >= 4}
  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
    images.length > 0
      ? "bg-primary-100 text-primary-700"
      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
  } disabled:opacity-50`}
>
  📷 {t("composer.addImage")} {images.length > 0 ? `(${images.length}/4)` : ""}
</button>
```

7. Modifier le texte du bouton publish pour montrer l'état d'upload :
```tsx
{submitting ? (uploading ? "Uploading..." : t("composer.publishing")) : t("composer.publish")}
```

---

## ÉTAPE 4 : Modifier l'API POST /api/posts pour gérer les images

Modifier `src/app/api/posts/route.ts` :

Après la création du post (`const { data: post, error } = ...`), ajouter l'insertion des images dans la table `post_images` :

```typescript
// Après la création du post réussie, insérer les images si présentes
const { image_urls } = body;
if (image_urls && Array.isArray(image_urls) && image_urls.length > 0 && post) {
  const imageInserts = image_urls.map((url: string, index: number) => ({
    post_id: post.id,
    image_url: url,
    position: index,
  }));

  // Utiliser le service client pour insérer (bypass RLS)
  const { createServiceClient } = await import('@/lib/supabase/service');
  const serviceClient = createServiceClient();
  await serviceClient.from('post_images').insert(imageInserts);
}
```

**ATTENTION** : Il y a 2 endroits dans le fichier route.ts qui créent un post (un dans le fallback par email, un dans le cas normal). Il faut ajouter la logique d'images DANS LES DEUX cas, OU refactoriser pour n'avoir qu'un seul point d'insertion du post. Le refactoring est préférable.

---

## ÉTAPE 5 : Profils publics — nouvelle page `/user/[username]`

### 5a. Créer la query pour récupérer un profil public

Modifier `src/lib/queries/users.ts` (le fichier existe peut-être déjà, sinon le créer) :

```typescript
import { createClient } from '@/lib/supabase/server';

export async function getUserByUsername(username: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, username, avatar_url, bio, created_at, show_email, email')
    .eq('username', username)
    .single();

  if (error || !data) return null;

  // Ne pas exposer l'email si show_email est false
  if (!data.show_email) {
    data.email = null;
  }

  return data;
}

export async function getUserPosts(userId: string, page = 1, limit = 20) {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_author_id_fkey(id, display_name, username, avatar_url),
      images:post_images(id, image_url, position, alt_text)
    `, { count: 'exact' })
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { posts: [], total: 0 };
  return { posts: data || [], total: count || 0 };
}
```

### 5b. Créer la page `src/app/[locale]/user/[username]/page.tsx`

```typescript
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getUserByUsername, getUserPosts } from "@/lib/queries/users";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PostCard } from "@/components/feed/PostCard";
import { Link } from "@/i18n/routing";
import type { Post } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  const user = await getUserByUsername(username);

  if (!user) return {};

  return generatePageMetadata({
    title: `${user.display_name || username} — Synapse`,
    description: user.bio || `${user.display_name || username}'s profile on Synapse`,
    locale,
    path: `/user/${username}`,
  });
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const user = await getUserByUsername(username);
  if (!user) notFound();

  // Check if viewer is logged in
  const supabase = await createClient();
  const { data: { user: viewer } } = await supabase.auth.getUser();

  let viewerId: string | undefined;
  if (viewer) {
    const { data: viewerData } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", viewer.id)
      .single() as { data: { id: string } | null };
    viewerId = viewerData?.id;
  }

  const { posts } = await getUserPosts(user.id);
  const initial = (user.display_name || username).charAt(0).toUpperCase();
  const memberSince = new Date(user.created_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="max-w-2xl py-6">
        {/* Back link */}
        <Link
          href="/feed"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          &larr; Back to feed
        </Link>

        {/* Profile header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name || username}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
                {initial}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {user.display_name || username}
              </h1>
              {user.username && (
                <p className="text-sm text-gray-500">@{user.username}</p>
              )}
              {user.bio && (
                <p className="mt-2 text-sm text-gray-700">{user.bio}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span>Member since {memberSince}</span>
                <span>{posts.length} posts</span>
              </div>
              {user.email && (
                <p className="mt-1 text-xs text-gray-500">{user.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* User's posts */}
        <div className="mt-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Posts</h2>
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={(post as Post).id}
                post={post as Post}
                isLoggedIn={!!viewer}
              />
            ))
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">No posts yet.</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
```

### 5c. Rendre les noms cliquables dans PostCard

Modifier `src/components/feed/PostCard.tsx` :

1. Ajouter l'import Link en haut :
```typescript
import { Link } from "@/i18n/routing";
```

2. Remplacer le `<span>` du nom de l'auteur (ligne ~162) par un `<Link>` :

Remplacer :
```tsx
<span className="font-semibold text-gray-900">{authorName}</span>
```

Par :
```tsx
{author?.username ? (
  <Link href={`/user/${author.username}`} className="font-semibold text-gray-900 hover:underline">
    {authorName}
  </Link>
) : (
  <span className="font-semibold text-gray-900">{authorName}</span>
)}
```

Et aussi rendre le `@username` cliquable :

Remplacer :
```tsx
{author?.username && <span className="text-sm text-gray-500">@{author.username}</span>}
```

Par :
```tsx
{author?.username && (
  <Link href={`/user/${author.username}`} className="text-sm text-gray-500 hover:text-primary-600 hover:underline">
    @{author.username}
  </Link>
)}
```

---

## ÉTAPE 6 : Supprimer ses propres posts

### 6a. Créer l'API route `/api/posts/[id]/delete`

Créer le fichier `src/app/api/posts/[id]/delete/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier l'auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trouver l'utilisateur interne
    const serviceClient = createServiceClient();
    const { data: userData } = await serviceClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Vérifier que le post appartient à l'utilisateur
    const { data: post } = await serviceClient
      .from('posts')
      .select('id, author_id')
      .eq('id', id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.author_id !== userData.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Supprimer les images du storage (optionnel, nettoie le storage)
    const { data: images } = await serviceClient
      .from('post_images')
      .select('image_url')
      .eq('post_id', id);

    if (images && images.length > 0) {
      const paths = images
        .map((img: { image_url: string }) => {
          // Extraire le path du fichier depuis l'URL publique
          const match = img.image_url.match(/post-images\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[];

      if (paths.length > 0) {
        await serviceClient.storage.from('post-images').remove(paths);
      }
    }

    // Supprimer le post (CASCADE supprime images, comments, likes, bookmarks)
    const { error: deleteError } = await serviceClient
      .from('posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 6b. Ajouter le bouton de suppression dans PostCard

Modifier `src/components/feed/PostCard.tsx` :

1. Ajouter les props nécessaires. Modifier l'interface du composant :
```typescript
export function PostCard({
  post,
  isLoggedIn = false,
  currentUserId,
  onDeleted,
}: {
  post: Post;
  isLoggedIn?: boolean;
  currentUserId?: string;
  onDeleted?: () => void;
})
```

2. Ajouter un état et une fonction de suppression :
```typescript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [deleteLoading, setDeleteLoading] = useState(false);

const isOwner = currentUserId && post.author_id === currentUserId;

const handleDelete = async () => {
  if (deleteLoading) return;
  setDeleteLoading(true);
  try {
    const res = await fetch(`/api/posts/${post.id}/delete`, { method: 'DELETE' });
    if (res.ok) {
      if (onDeleted) onDeleted();
      // Sinon, forcer un refresh
      window.location.reload();
    }
  } catch {
    // fail silently
  } finally {
    setDeleteLoading(false);
  }
};
```

3. Ajouter un menu "..." en haut à droite de la PostCard (dans le header, à la fin du div flex) :
```tsx
{isOwner && (
  <div className="relative ml-auto">
    {!showDeleteConfirm ? (
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label="More options"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      </button>
    ) : (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={deleteLoading}
          className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleteLoading ? "..." : t("post.delete")}
        </button>
        <button
          onClick={() => setShowDeleteConfirm(false)}
          className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    )}
  </div>
)}
```

### 6c. Passer `currentUserId` depuis les composants parents

Il faut modifier :
- `src/components/home/HomeFeed.tsx` → accepter `currentUserId` prop et le passer à `PostCard`
- `src/app/[locale]/page.tsx` (homepage) → passer `currentUserId={userId}` à `HomeFeed`
- `src/app/[locale]/feed/page.tsx` → passer `currentUserId={userId}` à chaque `PostCard`

---

## ÉTAPE 7 : Bouton "Charger plus" (pagination client)

### 7a. Créer l'API route GET pour charger plus de posts

Créer le fichier `src/app/api/posts/feed/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPosts } from '@/lib/queries/posts';
import { createClient } from '@/lib/supabase/server';
import type { PostCategory } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const category = searchParams.get('category') as PostCategory | undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    // Check user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userId: string | undefined;
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single() as { data: { id: string } | null };
      userId = userData?.id;
    }

    const { posts, total } = await getPosts({ page, limit, category, userId });

    return NextResponse.json({
      posts,
      total,
      page,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 7b. Ajouter le bouton "Load more" dans la page feed

Modifier `src/app/[locale]/feed/page.tsx` pour transformer le feed en composant client avec "Load more", OU plus simplement, créer un composant `LoadMoreButton` :

Créer `src/components/feed/LoadMoreButton.tsx` :

```typescript
"use client";

import { useState } from "react";
import { PostCard } from "./PostCard";
import type { Post } from "@/types/database";

export function LoadMoreButton({
  initialPage,
  total,
  limit,
  category,
  isLoggedIn,
  currentUserId,
}: {
  initialPage: number;
  total: number;
  limit: number;
  category?: string;
  isLoggedIn: boolean;
  currentUserId?: string;
}) {
  const [additionalPosts, setAdditionalPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);

  const hasMore = page * limit < total;

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: limit.toString(),
      });
      if (category) params.set('category', category);

      const res = await fetch(`/api/posts/feed?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAdditionalPosts(prev => [...prev, ...data.posts]);
        setPage(nextPage);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Additional posts loaded via "Load more" */}
      {additionalPosts.map((post) => (
        <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
      ))}

      {/* Load more button */}
      {hasMore && (
        <div className="pt-2 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load more posts"}
          </button>
        </div>
      )}
    </>
  );
}
```

Puis dans `src/app/[locale]/feed/page.tsx`, après la boucle des posts, ajouter :
```tsx
<LoadMoreButton
  initialPage={page}
  total={postsData.total}
  limit={20}
  category={category}
  isLoggedIn={!!user}
  currentUserId={userId}
/>
```

Faire pareil dans `HomeFeed.tsx` (avec limit=10).

---

## ÉTAPE 8 : Traductions manquantes

Ajouter dans les 3 fichiers de messages (en.json, fr.json, es.json) :

**en.json** dans `"profile"` :
```json
"posts": "Posts",
"memberSince": "Member since {date}",
"noPosts": "No posts yet."
```

**fr.json** dans `"profile"` :
```json
"posts": "Publications",
"memberSince": "Membre depuis {date}",
"noPosts": "Aucune publication pour le moment."
```

**es.json** dans `"profile"` :
```json
"posts": "Publicaciones",
"memberSince": "Miembro desde {date}",
"noPosts": "Sin publicaciones todavía."
```

---

## ÉTAPE 9 : Build + Test + Commit

1. **`npm run build`** — Vérifier que tout compile sans erreur
2. Tester :
   - Créer un post avec 1-2 images → vérifier qu'elles s'affichent
   - Cliquer sur un nom d'auteur → vérifier que le profil public s'affiche
   - Supprimer un post → vérifier qu'il disparaît
   - Scroller le feed → "Load more" charge plus de posts
3. Commiter :
```bash
git add -A
git commit -m "Add image upload, public profiles, post deletion, and feed pagination"
git push
```

---

## RÉSUMÉ DES FICHIERS

| Action | Fichier |
|--------|---------|
| CRÉER | `src/app/api/upload/route.ts` |
| CRÉER | `src/app/api/posts/[id]/delete/route.ts` |
| CRÉER | `src/app/api/posts/feed/route.ts` |
| CRÉER | `src/app/[locale]/user/[username]/page.tsx` |
| CRÉER | `src/components/feed/LoadMoreButton.tsx` |
| CRÉER ou MODIFIER | `src/lib/queries/users.ts` |
| MODIFIER | `src/components/feed/PostComposer.tsx` (upload images) |
| MODIFIER | `src/components/feed/PostCard.tsx` (liens profil + delete) |
| MODIFIER | `src/app/api/posts/route.ts` (insérer images) |
| MODIFIER | `src/app/[locale]/feed/page.tsx` (load more + currentUserId) |
| MODIFIER | `src/components/home/HomeFeed.tsx` (currentUserId + load more) |
| MODIFIER | `src/app/[locale]/page.tsx` (passer currentUserId) |
| MODIFIER | `src/messages/en.json`, `fr.json`, `es.json` |
