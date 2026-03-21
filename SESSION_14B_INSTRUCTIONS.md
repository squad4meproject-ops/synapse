# SESSION 14B — Espaces Thématiques (Sous-communautés)

## Contexte
Synapse est une plateforme communautaire IA (Next.js 14 App Router + TypeScript + Tailwind CSS + Supabase).
On ajoute des espaces thématiques : des sous-communautés que les utilisateurs peuvent rejoindre pour filtrer et organiser le contenu par thème.

## Rappel des règles du projet
- `users.id` ≠ `auth.uid()`. Mapping via `users.auth_id = auth.uid()` (UUID)
- Ne JAMAIS caster `auth.uid()` en `::text`
- API routes : `createClient()` pour auth, `createServiceClient()` pour mutations (bypass RLS)
- Traductions dans les 3 fichiers (en.json, fr.json, es.json)
- `setRequestLocale(locale)` dans chaque server component
- `Array.from(new Set(...))` au lieu de `[...new Set(...)]`
- `useRouter` importé de `@/i18n/routing` (JAMAIS de `next/navigation`)
- Toujours ajouter les classes `dark:` pour le dark mode

## Espaces prédéfinis

| Slug | Nom EN | Nom FR | Nom ES | Icône | Couleur |
|------|--------|--------|--------|-------|---------|
| prompt-engineering | Prompt Engineering | Prompt Engineering | Prompt Engineering | 💡 | bg-yellow-500 |
| ai-art | AI Art & Design | Art & Design IA | Arte y Diseño IA | 🎨 | bg-pink-500 |
| dev-ia | AI Development | Développement IA | Desarrollo IA | 💻 | bg-blue-500 |
| tools-reviews | Tools & Reviews | Outils & Avis | Herramientas y Reseñas | ⭐ | bg-green-500 |
| ai-news | AI News | Actualités IA | Noticias IA | 📰 | bg-red-500 |
| learning | Learning & Tutorials | Apprentissage & Tutos | Aprendizaje y Tutoriales | 📚 | bg-purple-500 |

---

# PARTIE 1 — MIGRATION SQL

## Étape 1 — Créer la migration `supabase/migrations/023_spaces.sql`

⚠️ **Ce fichier SQL sera exécuté manuellement par le développeur sur Supabase.**

```sql
-- =============================================
-- SESSION 14B : Espaces Thématiques
-- =============================================

-- 1. Table des espaces
CREATE TABLE IF NOT EXISTS spaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_es TEXT NOT NULL,
  description_en TEXT,
  description_fr TEXT,
  description_es TEXT,
  icon TEXT DEFAULT '💬',
  color TEXT DEFAULT 'bg-gray-500',
  cover_image_url TEXT,
  members_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table des membres d'un espace
CREATE TABLE IF NOT EXISTS space_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(space_id, user_id)
);

-- 3. Ajouter space_id aux posts (optionnel, un post peut ne pas être dans un espace)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES spaces(id) ON DELETE SET NULL;

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_space_members_space ON space_members(space_id);
CREATE INDEX IF NOT EXISTS idx_space_members_user ON space_members(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_space ON posts(space_id);
CREATE INDEX IF NOT EXISTS idx_spaces_slug ON spaces(slug);

-- 5. RLS
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Spaces are viewable by everyone"
  ON spaces FOR SELECT USING (true);

CREATE POLICY "Space members viewable by everyone"
  ON space_members FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join spaces"
  ON space_members FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can leave spaces"
  ON space_members FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- 6. Seed les espaces par défaut
INSERT INTO spaces (slug, name_en, name_fr, name_es, description_en, description_fr, description_es, icon, color) VALUES
  ('prompt-engineering', 'Prompt Engineering', 'Prompt Engineering', 'Prompt Engineering', 'Share and discuss prompting techniques', 'Partagez et discutez des techniques de prompting', 'Comparte y discute técnicas de prompting', '💡', 'bg-yellow-500'),
  ('ai-art', 'AI Art & Design', 'Art & Design IA', 'Arte y Diseño IA', 'Showcase AI-generated art and creative projects', 'Partagez vos créations artistiques IA', 'Muestra arte generado por IA y proyectos creativos', '🎨', 'bg-pink-500'),
  ('dev-ia', 'AI Development', 'Développement IA', 'Desarrollo IA', 'Technical discussions about AI/ML development', 'Discussions techniques sur le développement IA/ML', 'Discusiones técnicas sobre desarrollo IA/ML', '💻', 'bg-blue-500'),
  ('tools-reviews', 'Tools & Reviews', 'Outils & Avis', 'Herramientas y Reseñas', 'Review and compare AI tools', 'Évaluez et comparez les outils IA', 'Evalúa y compara herramientas de IA', '⭐', 'bg-green-500'),
  ('ai-news', 'AI News', 'Actualités IA', 'Noticias IA', 'Latest news and trends in AI', 'Dernières actualités et tendances en IA', 'Últimas noticias y tendencias en IA', '📰', 'bg-red-500'),
  ('learning', 'Learning & Tutorials', 'Apprentissage & Tutos', 'Aprendizaje y Tutoriales', 'Learn AI concepts and share tutorials', 'Apprenez l''IA et partagez des tutoriels', 'Aprende conceptos de IA y comparte tutoriales', '📚', 'bg-purple-500')
ON CONFLICT (slug) DO NOTHING;
```

---

# PARTIE 2 — API BACKEND

## Étape 2 — Créer les queries espaces `src/lib/queries/spaces.ts`

```typescript
import { createServiceClient } from "@/lib/supabase/service";

export async function getSpaces() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("is_active", true)
    .order("members_count", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSpaceBySlug(slug: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}

export async function getUserSpaces(userId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("space_members")
    .select("space_id, space:spaces(*)")
    .eq("user_id", userId);

  return (data || []).map((sm: { space: Record<string, unknown> }) => sm.space);
}

export async function isSpaceMember(spaceId: string, userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("space_members")
    .select("id", { count: "exact", head: true })
    .eq("space_id", spaceId)
    .eq("user_id", userId);

  return (count || 0) > 0;
}
```

---

## Étape 3 — API route join/leave espace `src/app/api/spaces/[slug]/join/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Trouver l'utilisateur interne
  const { data: internalUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!internalUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Trouver l'espace
  const { data: space } = await serviceClient
    .from("spaces")
    .select("id, members_count")
    .eq("slug", slug)
    .single();

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  // Vérifier si déjà membre
  const { count } = await serviceClient
    .from("space_members")
    .select("id", { count: "exact", head: true })
    .eq("space_id", space.id)
    .eq("user_id", internalUser.id);

  if ((count || 0) > 0) {
    // Quitter l'espace
    await serviceClient
      .from("space_members")
      .delete()
      .eq("space_id", space.id)
      .eq("user_id", internalUser.id);

    await serviceClient
      .from("spaces")
      .update({ members_count: Math.max(0, (space.members_count || 0) - 1) })
      .eq("id", space.id);

    return NextResponse.json({ joined: false });
  } else {
    // Rejoindre l'espace
    await serviceClient
      .from("space_members")
      .insert({ space_id: space.id, user_id: internalUser.id });

    await serviceClient
      .from("spaces")
      .update({ members_count: (space.members_count || 0) + 1 })
      .eq("id", space.id);

    return NextResponse.json({ joined: true });
  }
}
```

---

## Étape 4 — API route liste des posts par espace `src/app/api/spaces/[slug]/posts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  // Trouver l'espace
  const { data: space } = await supabase
    .from("spaces")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  const { data: posts, count } = await supabase
    .from("posts")
    .select("*, author:users!posts_author_id_fkey(id, display_name, username, avatar_url, level), images:post_images(id, image_url, position, alt_text), tags:post_tags(tag:tags(id, name, slug))", { count: "exact" })
    .eq("space_id", space.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({ posts: posts || [], total: count || 0 });
}
```

---

# PARTIE 3 — PAGES & COMPOSANTS UI

## Étape 5 — Créer la page des espaces `src/app/[locale]/spaces/page.tsx`

Page server component qui liste tous les espaces disponibles.

```tsx
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSpaces } from "@/lib/queries/spaces";
import { Container } from "@/components/ui/Container";
import { SpaceCard } from "@/components/spaces/SpaceCard";

export default async function SpacesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "spaces" });

  let spaces: Awaited<ReturnType<typeof getSpaces>> = [];
  try {
    spaces = await getSpaces();
  } catch {
    // fail silently
  }

  return (
    <Container className="py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">{t("description")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => (
          <SpaceCard key={space.id} space={space} locale={locale} />
        ))}
      </div>
    </Container>
  );
}
```

---

## Étape 6 — Créer le composant SpaceCard `src/components/spaces/SpaceCard.tsx`

```tsx
import { Link } from "@/i18n/routing";

interface Space {
  id: string;
  slug: string;
  name_en: string;
  name_fr: string;
  name_es: string;
  description_en: string | null;
  description_fr: string | null;
  description_es: string | null;
  icon: string;
  color: string;
  members_count: number;
  posts_count: number;
}

export function SpaceCard({ space, locale }: { space: Space; locale: string }) {
  const name = locale === "fr" ? space.name_fr : locale === "es" ? space.name_es : space.name_en;
  const desc = locale === "fr" ? space.description_fr : locale === "es" ? space.description_es : space.description_en;

  return (
    <Link
      href={`/spaces/${space.slug}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-card transition-all hover:shadow-card-hover dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${space.color} bg-opacity-10`}>
          {space.icon}
        </span>
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {space.members_count} membres · {space.posts_count} posts
          </p>
        </div>
      </div>
      {desc && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{desc}</p>
      )}
    </Link>
  );
}
```

---

## Étape 7 — Créer la page détail d'un espace `src/app/[locale]/spaces/[slug]/page.tsx`

Page qui affiche les posts d'un espace avec un bouton rejoindre/quitter.

```tsx
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSpaceBySlug } from "@/lib/queries/spaces";
import { Container } from "@/components/ui/Container";
import { SpaceContent } from "@/components/spaces/SpaceContent";
import { createClient } from "@/lib/supabase/server";

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "spaces" });

  const space = await getSpaceBySlug(slug);
  if (!space) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isMember = false;
  let userId: string | undefined;

  if (user) {
    const { data: internalUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single() as { data: { id: string } | null };

    userId = internalUser?.id;
    if (userId) {
      const { count } = await supabase
        .from("space_members")
        .select("id", { count: "exact", head: true })
        .eq("space_id", space.id)
        .eq("user_id", userId);
      isMember = (count || 0) > 0;
    }
  }

  const name = locale === "fr" ? space.name_fr : locale === "es" ? space.name_es : space.name_en;
  const desc = locale === "fr" ? space.description_fr : locale === "es" ? space.description_es : space.description_en;

  return (
    <Container className="py-8">
      <SpaceContent
        space={space}
        name={name}
        description={desc}
        initialIsMember={isMember}
        isLoggedIn={!!user}
        locale={locale}
        currentUserId={userId}
      />
    </Container>
  );
}
```

---

## Étape 8 — Créer le composant SpaceContent `src/components/spaces/SpaceContent.tsx`

Client component qui gère le join/leave et l'affichage des posts.

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { PostCard } from "@/components/feed/PostCard";
import { Link } from "@/i18n/routing";
import type { Post } from "@/types/database";

interface SpaceContentProps {
  space: {
    id: string;
    slug: string;
    icon: string;
    color: string;
    members_count: number;
    posts_count: number;
  };
  name: string;
  description: string | null;
  initialIsMember: boolean;
  isLoggedIn: boolean;
  locale: string;
  currentUserId?: string;
}

export function SpaceContent({ space, name, description, initialIsMember, isLoggedIn, locale, currentUserId }: SpaceContentProps) {
  const t = useTranslations("spaces");
  const [isMember, setIsMember] = useState(initialIsMember);
  const [membersCount, setMembersCount] = useState(space.members_count);
  const [joining, setJoining] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/spaces/${space.slug}/posts`)
      .then((res) => res.json())
      .then((data) => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [space.slug]);

  const handleJoinToggle = async () => {
    if (!isLoggedIn) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/spaces/${space.slug}/join`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsMember(data.joined);
        setMembersCount((prev) => data.joined ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch {
      // fail silently
    } finally {
      setJoining(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${space.color} bg-opacity-10`}>
            {space.icon}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h1>
            {description && <p className="mt-1 text-gray-600 dark:text-gray-300">{description}</p>}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {membersCount} {t("members")} · {space.posts_count} posts
            </p>
          </div>
        </div>
        {isLoggedIn && (
          <button
            onClick={handleJoinToggle}
            disabled={joining}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              isMember
                ? "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                : "bg-primary-600 text-white hover:bg-primary-700"
            }`}
          >
            {joining ? "..." : isMember ? t("leave") : t("join")}
          </button>
        )}
      </div>

      {/* Back link */}
      <Link href="/spaces" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
        &larr; {t("allSpaces")}
      </Link>

      {/* Posts */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
          ))
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("noPosts")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Étape 9 — Ajouter "Espaces" dans la navigation

**Fichier : `src/components/layout/Header.tsx`**

Ajouter le lien dans la liste `links` :
```typescript
{ href: "/spaces", label: t("spaces") },
```

L'ajouter entre "community" et "articles" (ou à la position souhaitée).

**Fichier : `src/components/layout/MobileNav.tsx`**

Ajouter dans la liste `links` :
```typescript
{ href: "/spaces", label: t("spaces"), icon: "🏠" },
```

---

## Étape 10 — Ajouter les traductions

**Dans les 3 fichiers** (`en.json`, `fr.json`, `es.json`), ajouter :

**10a. Section "spaces" :**

**en.json :**
```json
"spaces": {
  "title": "Spaces",
  "description": "Join themed communities to connect with like-minded AI enthusiasts.",
  "members": "members",
  "join": "Join",
  "leave": "Leave",
  "allSpaces": "All Spaces",
  "noPosts": "No posts in this space yet. Be the first to share!",
  "joined": "Joined"
}
```

**fr.json :**
```json
"spaces": {
  "title": "Espaces",
  "description": "Rejoignez des communautés thématiques pour échanger avec des passionnés d'IA.",
  "members": "membres",
  "join": "Rejoindre",
  "leave": "Quitter",
  "allSpaces": "Tous les espaces",
  "noPosts": "Aucun post dans cet espace pour l'instant. Soyez le premier à partager !",
  "joined": "Rejoint"
}
```

**es.json :**
```json
"spaces": {
  "title": "Espacios",
  "description": "Únete a comunidades temáticas para conectar con entusiastas de la IA.",
  "members": "miembros",
  "join": "Unirse",
  "leave": "Salir",
  "allSpaces": "Todos los espacios",
  "noPosts": "Aún no hay publicaciones en este espacio. ¡Sé el primero en compartir!",
  "joined": "Unido"
}
```

**10b. Ajouter "spaces" dans la section "navigation" des 3 fichiers :**

- en.json > navigation : `"spaces": "Spaces"`
- fr.json > navigation : `"spaces": "Espaces"`
- es.json > navigation : `"spaces": "Espacios"`

---

## Étape 11 — Ajouter un sélecteur d'espace dans le PostComposer

**Fichier : `src/components/feed/PostComposer.tsx`**

Quand l'utilisateur est sur la page d'un espace, les posts créés doivent être associés à cet espace.

Ajouter une prop optionnelle `spaceId` au composant :
```tsx
interface PostComposerProps {
  // ... props existantes
  spaceId?: string;
}
```

Dans le body du POST vers `/api/posts`, inclure `space_id: spaceId` si défini.

Dans `src/app/api/posts/route.ts`, ajouter `space_id` dans l'insert si le body le contient.

---

## Étape 12 — Build de vérification

```bash
npm run build
```

Le build doit passer sans erreur.

---

## Migrations SQL à exécuter manuellement

```
supabase/migrations/023_spaces.sql
```
