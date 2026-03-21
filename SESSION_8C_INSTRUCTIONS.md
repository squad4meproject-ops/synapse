# SESSION 8C — Fix bugs + Mobile Auth + Paramètres utilisateur

## CONTEXTE
Trois choses à corriger/ajouter :
1. Bug : l'upload d'images ne fonctionne pas (le post ne se publie pas quand il y a des images)
2. Mobile : pas de boutons Login/Signup dans le menu mobile
3. Paramètres utilisateur avancés pour donner un vrai feel de réseau social

**IMPORTANT** : Fais les étapes UNE PAR UNE, dans l'ordre. Attends ma confirmation entre chaque étape.

---

## ÉTAPE 1 : Fix du bug d'upload d'images

### Problème
Le fichier `File` reçu via `request.formData()` dans une API route Next.js (environnement Node.js) n'est pas toujours compatible directement avec le SDK Supabase Storage. Il faut convertir le `File` en `ArrayBuffer`/`Buffer` avant de l'envoyer.

De plus, si l'insertion dans `post_images` échoue, le catch renvoie un 500 et le formulaire ne se réinitialise pas côté client.

### Fix dans `src/app/api/upload/route.ts`

Remplacer tout le fichier par :

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
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' }, { status: 400 });
    }

    // Vérifier la taille (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // 3. Convertir le File en Buffer (fix compatibilité Node.js / Supabase SDK)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Upload vers Supabase Storage
    const serviceClient = createServiceClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { error: uploadError } = await serviceClient.storage
      .from('post-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // 5. Construire l'URL publique
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

### Fix dans `src/app/api/posts/route.ts`

L'insertion des images dans `post_images` ne doit PAS faire planter la création du post si elle échoue. Entourer l'insertion des images dans un try-catch séparé :

Remplacer le bloc d'insertion des images (lignes ~59-71) par :

```typescript
    // Insérer les images si présentes (non-bloquant si erreur)
    const { image_urls } = body;
    if (image_urls && Array.isArray(image_urls) && image_urls.length > 0 && post) {
      try {
        const imageInserts = image_urls.map((url: string, index: number) => ({
          post_id: post.id,
          image_url: url,
          position: index,
        }));

        const { createServiceClient } = await import('@/lib/supabase/service');
        const serviceClient = createServiceClient();
        const { error: imgError } = await serviceClient.from('post_images').insert(imageInserts);
        if (imgError) {
          console.error('Error inserting post images:', imgError);
        }
      } catch (imgErr) {
        console.error('Error inserting post images:', imgErr);
        // On ne fait PAS échouer la création du post pour ça
      }
    }
```

### Fix dans `src/components/feed/PostComposer.tsx`

Ajouter un meilleur feedback en cas d'erreur d'upload. Après le `catch` dans `handleSubmit`, ajouter un état d'erreur :

1. Ajouter un état :
```typescript
const [error, setError] = useState<string | null>(null);
```

2. Dans handleSubmit, avant le try, reset l'erreur :
```typescript
setError(null);
```

3. Dans le catch du upload des images, ajouter :
```typescript
// Si certains uploads ont échoué
if (imageUrls.length < images.length) {
  console.warn(`Only ${imageUrls.length}/${images.length} images uploaded successfully`);
}
```

4. Dans le catch global, set l'erreur :
```typescript
} catch (err) {
  setError('Failed to publish. Please try again.');
}
```

5. Afficher l'erreur dans le JSX, juste avant le textarea :
```tsx
{error && (
  <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-600">
    {error}
  </div>
)}
```

---

## ÉTAPE 2 : Ajouter les boutons Auth dans le menu mobile

### Modifier `src/components/layout/MobileNav.tsx`

Remplacer tout le fichier par :

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { AuthButton } from "@/components/auth/AuthButton";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("navigation");

  const links = [
    { href: "/", label: t("home") },
    { href: "/feed", label: t("community") },
    { href: "/articles", label: t("articles") },
    { href: "/tools", label: t("tools") },
    { href: "/about", label: t("about") },
  ] as const;

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-3">
        <AuthButton />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-gray-200 bg-white shadow-lg">
          <nav className="flex flex-col space-y-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary-600"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="px-3 py-2">
                <LocaleSwitcher />
              </div>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
```

**Points importants :**
- `AuthButton` est placé AVANT le bouton hamburger (donc visible sans ouvrir le menu)
- Le lien "Community" (`/feed`) est ajouté dans les liens mobile (il manquait avant)
- Le sélecteur de langue est séparé visuellement

---

## ÉTAPE 3 : Page des posts sauvegardés (Bookmarks)

Les utilisateurs peuvent déjà sauvegarder des posts avec le bouton bookmark. Mais ils n'ont aucun moyen de les retrouver ! Créer une page `/bookmarks`.

### 3a. Créer la query `getBookmarkedPosts`

Ajouter dans `src/lib/queries/posts.ts` :

```typescript
// ============================================================
// GET BOOKMARKED POSTS (pour un utilisateur)
// ============================================================
export async function getBookmarkedPosts(userId: string, page = 1, limit = 20) {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // Récupérer les post_ids des bookmarks
    const { data: bookmarks, error: bError } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (bError || !bookmarks || bookmarks.length === 0) {
      return { posts: [] as Post[], total: 0 };
    }

    const postIds = bookmarks.map(b => (b as { post_id: string }).post_id);

    // Récupérer les posts complets
    const { data, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, display_name, username, avatar_url),
        images:post_images(id, image_url, position, alt_text)
      `, { count: 'exact' })
      .in('id', postIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Marquer tous comme saved puisque c'est la page bookmarks
    const posts = (data || []).map(post => ({
      ...post,
      is_saved: true,
      images: ((post as Post).images || []).sort((a, b) => a.position - b.position),
    })) as Post[];

    // Vérifier les likes
    if (posts.length > 0) {
      const pIds = posts.map(p => p.id);
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', pIds);

      const likedIds = new Set(((likesData || []) as { post_id: string }[]).map(l => l.post_id));
      posts.forEach(p => { p.is_liked = likedIds.has(p.id); });
    }

    return { posts, total: count || postIds.length };
  } catch (error) {
    console.error('Error fetching bookmarked posts:', error);
    return { posts: [] as Post[], total: 0 };
  }
}
```

### 3b. Créer la page `src/app/[locale]/bookmarks/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/lib/seo";
import { getBookmarkedPosts } from "@/lib/queries/posts";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PostCard } from "@/components/feed/PostCard";
import { Link } from "@/i18n/routing";
import type { Post } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return generatePageMetadata({
    title: "Saved Posts — Synapse",
    description: "Your saved posts on Synapse",
    locale,
    path: "/bookmarks",
  });
}

export default async function BookmarksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Trouver l'user interne
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single() as { data: { id: string } | null };

  const userId = userData?.id;
  let posts: Post[] = [];

  if (userId) {
    const result = await getBookmarkedPosts(userId);
    posts = result.posts;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="max-w-2xl py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Saved Posts</h1>
          <Link
            href="/feed"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            &larr; Back to feed
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isLoggedIn={true}
                currentUserId={userId}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
            <p className="mt-4 text-sm font-medium text-gray-900">No saved posts yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Posts you save will appear here. Tap the bookmark icon on any post to save it.
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
```

### 3c. Ajouter le lien "Saved" dans le menu dropdown de l'AuthButton

Modifier `src/components/auth/AuthButton.tsx` — ajouter un lien "Saved Posts" dans le menu dropdown, entre "Profile" et "Logout" :

```tsx
<Link
  href="/bookmarks"
  onClick={() => setMenuOpen(false)}
  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
>
  Saved Posts
</Link>
```

### 3d. Protéger la route `/bookmarks` dans le middleware

Vérifier que le middleware protège `/bookmarks` comme il protège `/profile`. Ouvrir `middleware.ts` (à la racine) et s'assurer que le pattern de protection inclut `/bookmarks`.

---

## ÉTAPE 4 : Paramètres utilisateur dans la page profil

Ajouter une section "Preferences" dans la page profil avec ces options :

### 4a. Ajouter les colonnes en BDD (migration SQL)

**Créer le fichier `supabase/migrations/013_user_preferences.sql` :**

```sql
-- Migration 013: User preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}';

-- Les préférences seront stockées comme :
-- {
--   "default_post_locale": "en",       -- langue par défaut des posts
--   "profile_visible": true,           -- profil visible dans les résultats
--   "email_notifications": false       -- pour le futur système de notifications
-- }
```

**⚠️ IMPORTANT : Cette migration doit être exécutée dans le SQL Editor de Supabase par Benjamin. Claude Code doit juste créer le fichier. Benjamin ira copier-coller le SQL dans le dashboard.**

### 4b. Modifier la page profil pour ajouter les préférences

Ajouter APRÈS le formulaire principal et AVANT la Danger Zone dans `src/app/[locale]/profile/page.tsx` :

1. Ajouter l'état des préférences :
```typescript
const [defaultPostLocale, setDefaultPostLocale] = useState("en");
const [profileVisible, setProfileVisible] = useState(true);
const [emailNotifications, setEmailNotifications] = useState(false);
```

2. Dans le useEffect, après le chargement du profil, charger les préférences :
```typescript
if (profile) {
  // ... existing code ...
  const prefs = profile.preferences || {};
  setDefaultPostLocale(prefs.default_post_locale || 'en');
  setProfileVisible(prefs.profile_visible !== false);
  setEmailNotifications(prefs.email_notifications || false);
}
```

3. Dans handleSave, inclure les préférences :
```typescript
const { error } = await supabase
  .from("users")
  .update({
    display_name: displayName,
    username: username || null,
    bio: bio || null,
    show_email: showEmail,
    social_links: socialLinks,
    preferences: {
      default_post_locale: defaultPostLocale,
      profile_visible: profileVisible,
      email_notifications: emailNotifications,
    },
  })
  .eq("auth_id", user.id);
```

4. Ajouter le JSX de la section Preferences (entre `</form>` et la Danger Zone) :
```tsx
{/* Preferences */}
<div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
  <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>

  {/* Default post language */}
  <div className="mt-4">
    <label className="mb-1 block text-sm font-medium">Default post language</label>
    <select
      value={defaultPostLocale}
      onChange={(e) => setDefaultPostLocale(e.target.value)}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      <option value="en">English</option>
      <option value="fr">Français</option>
      <option value="es">Español</option>
    </select>
    <p className="mt-1 text-xs text-gray-500">Language used by default when creating new posts</p>
  </div>

  {/* Profile visibility toggle */}
  <div className="mt-4 flex items-center justify-between rounded-md border border-gray-200 p-4">
    <div>
      <p className="text-sm font-medium">Public profile</p>
      <p className="text-xs text-gray-500">Allow others to see your profile when they click your name</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={profileVisible}
      onClick={() => setProfileVisible(!profileVisible)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        profileVisible ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
          profileVisible ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>

  {/* Email notifications toggle */}
  <div className="mt-4 flex items-center justify-between rounded-md border border-gray-200 p-4">
    <div>
      <p className="text-sm font-medium">Email notifications</p>
      <p className="text-xs text-gray-500">Get notified about replies and likes (coming soon)</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={emailNotifications}
      onClick={() => setEmailNotifications(!emailNotifications)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        emailNotifications ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
          emailNotifications ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>

  <button
    onClick={handleSave}
    disabled={saving}
    className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
  >
    {saving ? t("saving") : "Save preferences"}
  </button>
</div>
```

### 4c. Mettre à jour l'interface Profile

Dans l'interface `Profile` en haut du fichier `profile/page.tsx`, ajouter :
```typescript
preferences: {
  default_post_locale?: string;
  profile_visible?: boolean;
  email_notifications?: boolean;
} | null;
```

### 4d. Mettre à jour le type Database

Dans `src/types/database.ts`, ajouter `preferences` dans la table `users` :
```typescript
preferences: Json;
```
(dans Row, Insert, et Update)

---

## ÉTAPE 5 : Ajouter les traductions

**en.json** dans `"profile"` :
```json
"preferences": "Preferences",
"defaultPostLanguage": "Default post language",
"defaultPostLanguageDesc": "Language used by default when creating new posts",
"publicProfile": "Public profile",
"publicProfileDesc": "Allow others to see your profile when they click your name",
"emailNotifications": "Email notifications",
"emailNotificationsDesc": "Get notified about replies and likes (coming soon)",
"savePreferences": "Save preferences",
"savedPosts": "Saved Posts",
"noSavedPosts": "No saved posts yet",
"noSavedPostsDesc": "Posts you save will appear here. Tap the bookmark icon on any post to save it."
```

**fr.json** dans `"profile"` :
```json
"preferences": "Préférences",
"defaultPostLanguage": "Langue par défaut des posts",
"defaultPostLanguageDesc": "Langue utilisée par défaut lors de la création de nouveaux posts",
"publicProfile": "Profil public",
"publicProfileDesc": "Permettre aux autres de voir votre profil quand ils cliquent sur votre nom",
"emailNotifications": "Notifications par email",
"emailNotificationsDesc": "Être notifié des réponses et des likes (bientôt disponible)",
"savePreferences": "Enregistrer les préférences",
"savedPosts": "Posts sauvegardés",
"noSavedPosts": "Aucun post sauvegardé",
"noSavedPostsDesc": "Les posts que vous sauvegardez apparaîtront ici. Appuyez sur l'icône favori sur n'importe quel post."
```

**es.json** dans `"profile"` :
```json
"preferences": "Preferencias",
"defaultPostLanguage": "Idioma predeterminado de publicaciones",
"defaultPostLanguageDesc": "Idioma utilizado por defecto al crear nuevas publicaciones",
"publicProfile": "Perfil público",
"publicProfileDesc": "Permitir que otros vean tu perfil cuando hagan clic en tu nombre",
"emailNotifications": "Notificaciones por email",
"emailNotificationsDesc": "Recibir notificaciones sobre respuestas y likes (próximamente)",
"savePreferences": "Guardar preferencias",
"savedPosts": "Posts guardados",
"noSavedPosts": "No hay posts guardados",
"noSavedPostsDesc": "Los posts que guardes aparecerán aquí. Toca el icono de favorito en cualquier post."
```

---

## ÉTAPE 6 : Build + Test + Commit

1. **`npm run build`** — Vérifier compilation
2. Tester :
   - Créer un post AVEC une image → doit se publier ET afficher l'image
   - Sur mobile (F12 → responsive) → les boutons Login/Signup doivent apparaître
   - Aller sur `/bookmarks` → page des posts sauvegardés
   - Aller sur `/profile` → section Preferences visible
3. Commiter :
```bash
git add -A
git commit -m "Fix image upload, add mobile auth, bookmarks page, user preferences"
git push
```

---

## ⚠️ APRÈS LE COMMIT — MIGRATION SQL À EXÉCUTER PAR BENJAMIN

Après le commit, Benjamin doit aller dans le **SQL Editor** de Supabase et exécuter :

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}';
```

Sans ça, les préférences ne seront pas sauvegardées.

---

## RÉSUMÉ DES FICHIERS

| Action | Fichier |
|--------|---------|
| MODIFIER | `src/app/api/upload/route.ts` (fix Buffer) |
| MODIFIER | `src/app/api/posts/route.ts` (try-catch images) |
| MODIFIER | `src/components/feed/PostComposer.tsx` (error feedback) |
| MODIFIER | `src/components/layout/MobileNav.tsx` (AuthButton + community link) |
| MODIFIER | `src/components/auth/AuthButton.tsx` (lien Saved Posts) |
| CRÉER | `src/app/[locale]/bookmarks/page.tsx` |
| MODIFIER | `src/lib/queries/posts.ts` (getBookmarkedPosts) |
| MODIFIER | `src/app/[locale]/profile/page.tsx` (preferences section) |
| CRÉER | `supabase/migrations/013_user_preferences.sql` |
| MODIFIER | `src/types/database.ts` (preferences column) |
| MODIFIER | `src/messages/en.json`, `fr.json`, `es.json` |
