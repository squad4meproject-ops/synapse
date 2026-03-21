# Session 6 — Phase 2B : Base de données communauté + Storage

## Contexte pour Claude Code

Tu travailles sur le projet Synapse, une plateforme communautaire internationale autour de l'IA.
Le dossier du projet est : `C:\Users\Smartlabz\OneDrive\Documents\synapse`
Stack : Next.js 14, TypeScript, Tailwind CSS, Supabase (PostgreSQL), next-intl.

On implémente la Phase 2B — le feed social communautaire.

**IMPORTANT : Fais chaque étape une par une. Une seule commande bash à la fois. Ne combine jamais plusieurs commandes. Attends que chaque étape soit terminée avant de passer à la suivante.**

---

## Étape 1 : Migration SQL 006 — Tables du feed social

Crée le fichier `supabase/migrations/006_community_feed.sql` avec le contenu suivant.

```sql
-- ============================================================
-- Migration 006: Community Feed Tables
-- Tables: posts, post_images, comments, likes, bookmarks
-- ============================================================

-- 1. Create ENUM type for post categories
CREATE TYPE post_category AS ENUM (
  'creation',
  'prompt',
  'question',
  'discussion',
  'tool_review'
);

-- 2. Table: posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category post_category NOT NULL DEFAULT 'discussion',
  content TEXT NOT NULL,
  prompt_content TEXT,                          -- Le prompt IA (si catégorie = prompt)
  link_url TEXT,                                -- Lien partagé (optionnel)
  link_preview JSONB,                           -- Aperçu du lien {title, description, image}
  tool_id UUID REFERENCES ai_tools(id) ON DELETE SET NULL,  -- Lien vers un outil (si tool_review)
  locale VARCHAR(5) NOT NULL DEFAULT 'en',
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  saves_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour le feed (tri par date, filtrage par catégorie)
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_locale ON posts(locale);

-- 3. Table: post_images
CREATE TABLE post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,         -- Ordre d'affichage (0, 1, 2, 3...)
  alt_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_images_post_id ON post_images(post_id);

-- 4. Table: comments (avec 1 niveau de réponse)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,  -- NULL = commentaire racine, UUID = réponse
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

-- 5. Table: likes (pour posts ET commentaires)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Un seul like par user par post
  CONSTRAINT unique_post_like UNIQUE (user_id, post_id),
  -- Un seul like par user par commentaire
  CONSTRAINT unique_comment_like UNIQUE (user_id, comment_id),
  -- Doit liker soit un post soit un commentaire (pas les deux, pas aucun)
  CONSTRAINT like_target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_comment_id ON likes(comment_id);

-- 6. Table: bookmarks (sauvegardes)
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_bookmark UNIQUE (user_id, post_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_post_id ON bookmarks(post_id);

-- 7. Trigger: auto-update updated_at sur posts
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Triggers: auto-incrémenter/décrémenter les compteurs

-- Likes count sur posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Likes count sur comments
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.comment_id IS NOT NULL THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.comment_id IS NOT NULL THEN
    UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Comments count sur posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Saves count sur posts
CREATE OR REPLACE FUNCTION update_post_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET saves_count = saves_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_saves_count
  AFTER INSERT OR DELETE ON bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_post_saves_count();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Posts: tout le monde peut lire, seul l'auteur peut modifier/supprimer
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid()::text = author_id::text);

-- Post images: mêmes règles que les posts
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post images are viewable by everyone"
  ON post_images FOR SELECT USING (true);

CREATE POLICY "Users can add images to own posts"
  ON post_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_id AND posts.author_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete images from own posts"
  ON post_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.id = post_id AND posts.author_id::text = auth.uid()::text
    )
  );

-- Comments: tout le monde peut lire, seul l'auteur peut modifier/supprimer
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid()::text = author_id::text);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid()::text = author_id::text);

-- Likes: tout le monde peut voir, chaque user gère ses propres likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT USING (true);

CREATE POLICY "Users can like"
  ON likes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can unlike"
  ON likes FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Bookmarks: privés — seul le propriétaire voit les siens
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- ============================================================
-- GRANTS (comme les tables existantes)
-- ============================================================

GRANT SELECT ON posts, post_images, comments, likes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON posts, post_images, comments, likes, bookmarks TO authenticated;
GRANT ALL ON posts, post_images, comments, likes, bookmarks TO service_role;
```

**Après avoir créé le fichier**, dis-moi que c'est fait. Ne l'exécute PAS dans Supabase — je le ferai moi-même via le SQL Editor de Supabase.

---

## Étape 2 : Migration SQL 007 — Colonne is_premium sur users

Crée le fichier `supabase/migrations/007_user_premium.sql` :

```sql
-- ============================================================
-- Migration 007: Add is_premium to users
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- Permet de filtrer facilement les users premium
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium) WHERE is_premium = true;
```

---

## Étape 3 : Types TypeScript

Mets à jour le fichier `src/types/database.ts` pour ajouter les nouveaux types.

Ajoute ces types (ne supprime rien de l'existant, ajoute en dessous) :

```typescript
// ============================================================
// Community Feed Types
// ============================================================

export type PostCategory = 'creation' | 'prompt' | 'question' | 'discussion' | 'tool_review';

export interface Post {
  id: string;
  author_id: string;
  category: PostCategory;
  content: string;
  prompt_content: string | null;
  link_url: string | null;
  link_preview: {
    title?: string;
    description?: string;
    image?: string;
  } | null;
  tool_id: string | null;
  locale: string;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: User;
  images?: PostImage[];
  tool?: AITool;
  // Current user state (computed in queries)
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface PostImage {
  id: string;
  post_id: string;
  image_url: string;
  position: number;
  alt_text: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: User;
  replies?: Comment[];
  // Current user state
  is_liked?: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}
```

**Vérifie que le type `User` existant dans ce fichier contient bien un champ `is_premium?: boolean`. Si ce n'est pas le cas, ajoute-le à l'interface User.**

---

## Étape 4 : Queries Supabase pour le feed

Crée le fichier `src/lib/queries/posts.ts` :

```typescript
import { createClient } from '@/lib/supabase/server';
import type { Post, Comment, PostCategory } from '@/types/database';

// ============================================================
// GET POSTS (feed principal)
// ============================================================
export async function getPosts({
  page = 1,
  limit = 20,
  category,
  locale,
  userId, // pour calculer is_liked et is_saved
}: {
  page?: number;
  limit?: number;
  category?: PostCategory;
  locale?: string;
  userId?: string;
} = {}): Promise<{ posts: Post[]; total: number }> {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, name, username, avatar_url),
        images:post_images(id, image_url, position, alt_text),
        tool:ai_tools!posts_tool_id_fkey(id, name, slug, logo_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (locale) {
      query = query.eq('locale', locale);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    let posts = (data || []) as Post[];

    // Si un user est connecté, vérifier ses likes et bookmarks
    if (userId && posts.length > 0) {
      const postIds = posts.map(p => p.id);

      const [likesResult, bookmarksResult] = await Promise.all([
        supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds),
        supabase
          .from('bookmarks')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds),
      ]);

      const likedPostIds = new Set((likesResult.data || []).map(l => l.post_id));
      const savedPostIds = new Set((bookmarksResult.data || []).map(b => b.post_id));

      posts = posts.map(post => ({
        ...post,
        is_liked: likedPostIds.has(post.id),
        is_saved: savedPostIds.has(post.id),
        images: (post.images || []).sort((a, b) => a.position - b.position),
      }));
    }

    return { posts, total: count || 0 };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], total: 0 };
  }
}

// ============================================================
// GET POST BY ID
// ============================================================
export async function getPostById(postId: string, userId?: string): Promise<Post | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, name, username, avatar_url),
        images:post_images(id, image_url, position, alt_text),
        tool:ai_tools!posts_tool_id_fkey(id, name, slug, logo_url)
      `)
      .eq('id', postId)
      .single();

    if (error) throw error;
    if (!data) return null;

    let post = data as Post;

    if (userId) {
      const [likeResult, bookmarkResult] = await Promise.all([
        supabase
          .from('likes')
          .select('id')
          .eq('user_id', userId)
          .eq('post_id', postId)
          .maybeSingle(),
        supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', userId)
          .eq('post_id', postId)
          .maybeSingle(),
      ]);

      post = {
        ...post,
        is_liked: !!likeResult.data,
        is_saved: !!bookmarkResult.data,
        images: (post.images || []).sort((a, b) => a.position - b.position),
      };
    }

    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// ============================================================
// GET COMMENTS FOR A POST
// ============================================================
export async function getComments(postId: string, userId?: string): Promise<Comment[]> {
  try {
    const supabase = await createClient();

    // Récupérer tous les commentaires du post
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_author_id_fkey(id, name, username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    let comments = data as Comment[];

    // Vérifier les likes de l'user connecté
    if (userId && comments.length > 0) {
      const commentIds = comments.map(c => c.id);
      const { data: likesData } = await supabase
        .from('likes')
        .select('comment_id')
        .eq('user_id', userId)
        .in('comment_id', commentIds);

      const likedCommentIds = new Set((likesData || []).map(l => l.comment_id));
      comments = comments.map(c => ({
        ...c,
        is_liked: likedCommentIds.has(c.id),
      }));
    }

    // Structurer en arbre : commentaires racines + replies
    const rootComments = comments.filter(c => c.parent_id === null);
    const replies = comments.filter(c => c.parent_id !== null);

    return rootComments.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_id === comment.id),
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}
```

---

## Étape 5 : Traductions i18n

Ajoute les clés de traduction suivantes dans les 3 fichiers de messages.

Dans `src/messages/en.json`, ajoute ce namespace (au même niveau que "auth", "profile", etc.) :

```json
"feed": {
  "title": "Community Feed",
  "newPost": "Share something...",
  "categories": {
    "all": "All",
    "creation": "AI Creations",
    "prompt": "Prompts",
    "question": "Questions",
    "discussion": "Discussions",
    "tool_review": "Tool Reviews"
  },
  "post": {
    "like": "Like",
    "liked": "Liked",
    "save": "Save",
    "saved": "Saved",
    "comment": "Comment",
    "comments": "Comments",
    "share": "Share",
    "copyPrompt": "Copy prompt",
    "promptCopied": "Prompt copied!",
    "delete": "Delete",
    "deleteConfirm": "Are you sure you want to delete this post?",
    "edit": "Edit",
    "report": "Report",
    "viewMore": "View more"
  },
  "composer": {
    "placeholder": "What's on your mind about AI?",
    "categorySelect": "Choose a category",
    "addImage": "Add images",
    "addLink": "Add a link",
    "addPrompt": "Share a prompt",
    "promptPlaceholder": "Paste your prompt here...",
    "linkPlaceholder": "https://...",
    "publish": "Post",
    "publishing": "Posting...",
    "maxImages": "Free accounts: up to 4 images. Upgrade to Premium for up to 10.",
    "loginToPost": "Log in to share with the community"
  },
  "comments": {
    "placeholder": "Write a comment...",
    "replyPlaceholder": "Write a reply...",
    "reply": "Reply",
    "replies": "replies",
    "showReplies": "Show replies",
    "hideReplies": "Hide replies",
    "loginToComment": "Log in to comment"
  },
  "empty": {
    "title": "No posts yet",
    "description": "Be the first to share something with the community!",
    "filtered": "No posts in this category yet."
  },
  "sidebar": {
    "trending": "Trending Tools",
    "latestArticles": "Latest Articles",
    "topContributors": "Top Contributors"
  }
}
```

Dans `src/messages/fr.json`, ajoute :

```json
"feed": {
  "title": "Fil d'actualité",
  "newPost": "Partagez quelque chose...",
  "categories": {
    "all": "Tout",
    "creation": "Créations IA",
    "prompt": "Prompts",
    "question": "Questions",
    "discussion": "Discussions",
    "tool_review": "Avis sur les outils"
  },
  "post": {
    "like": "J'aime",
    "liked": "Aimé",
    "save": "Sauvegarder",
    "saved": "Sauvegardé",
    "comment": "Commenter",
    "comments": "Commentaires",
    "share": "Partager",
    "copyPrompt": "Copier le prompt",
    "promptCopied": "Prompt copié !",
    "delete": "Supprimer",
    "deleteConfirm": "Êtes-vous sûr de vouloir supprimer ce post ?",
    "edit": "Modifier",
    "report": "Signaler",
    "viewMore": "Voir plus"
  },
  "composer": {
    "placeholder": "Quoi de neuf dans le monde de l'IA ?",
    "categorySelect": "Choisir une catégorie",
    "addImage": "Ajouter des images",
    "addLink": "Ajouter un lien",
    "addPrompt": "Partager un prompt",
    "promptPlaceholder": "Collez votre prompt ici...",
    "linkPlaceholder": "https://...",
    "publish": "Publier",
    "publishing": "Publication...",
    "maxImages": "Compte gratuit : jusqu'à 4 images. Passez Premium pour 10.",
    "loginToPost": "Connectez-vous pour partager avec la communauté"
  },
  "comments": {
    "placeholder": "Écrire un commentaire...",
    "replyPlaceholder": "Écrire une réponse...",
    "reply": "Répondre",
    "replies": "réponses",
    "showReplies": "Afficher les réponses",
    "hideReplies": "Masquer les réponses",
    "loginToComment": "Connectez-vous pour commenter"
  },
  "empty": {
    "title": "Aucun post pour le moment",
    "description": "Soyez le premier à partager quelque chose avec la communauté !",
    "filtered": "Aucun post dans cette catégorie pour le moment."
  },
  "sidebar": {
    "trending": "Outils tendance",
    "latestArticles": "Derniers articles",
    "topContributors": "Top contributeurs"
  }
}
```

Dans `src/messages/es.json`, ajoute :

```json
"feed": {
  "title": "Feed de la comunidad",
  "newPost": "Comparte algo...",
  "categories": {
    "all": "Todo",
    "creation": "Creaciones IA",
    "prompt": "Prompts",
    "question": "Preguntas",
    "discussion": "Discusiones",
    "tool_review": "Reseñas de herramientas"
  },
  "post": {
    "like": "Me gusta",
    "liked": "Te gusta",
    "save": "Guardar",
    "saved": "Guardado",
    "comment": "Comentar",
    "comments": "Comentarios",
    "share": "Compartir",
    "copyPrompt": "Copiar prompt",
    "promptCopied": "¡Prompt copiado!",
    "delete": "Eliminar",
    "deleteConfirm": "¿Estás seguro de que quieres eliminar este post?",
    "edit": "Editar",
    "report": "Reportar",
    "viewMore": "Ver más"
  },
  "composer": {
    "placeholder": "¿Qué hay de nuevo en el mundo de la IA?",
    "categorySelect": "Elige una categoría",
    "addImage": "Añadir imágenes",
    "addLink": "Añadir un enlace",
    "addPrompt": "Compartir un prompt",
    "promptPlaceholder": "Pega tu prompt aquí...",
    "linkPlaceholder": "https://...",
    "publish": "Publicar",
    "publishing": "Publicando...",
    "maxImages": "Cuenta gratuita: hasta 4 imágenes. Hazte Premium para 10.",
    "loginToPost": "Inicia sesión para compartir con la comunidad"
  },
  "comments": {
    "placeholder": "Escribe un comentario...",
    "replyPlaceholder": "Escribe una respuesta...",
    "reply": "Responder",
    "replies": "respuestas",
    "showReplies": "Mostrar respuestas",
    "hideReplies": "Ocultar respuestas",
    "loginToComment": "Inicia sesión para comentar"
  },
  "empty": {
    "title": "Sin publicaciones aún",
    "description": "¡Sé el primero en compartir algo con la comunidad!",
    "filtered": "Sin publicaciones en esta categoría aún."
  },
  "sidebar": {
    "trending": "Herramientas en tendencia",
    "latestArticles": "Últimos artículos",
    "topContributors": "Top contribuidores"
  }
}
```

---

## Étape 6 : Seed de données de démo

Crée le fichier `supabase/migrations/008_seed_community_posts.sql` :

```sql
-- ============================================================
-- Migration 008: Seed demo community posts
-- Utilise l'admin existant (benjamin@synapse.ai) comme auteur
-- ============================================================

-- Récupérer l'ID de l'admin
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM users WHERE email = 'benjamin@synapse.ai' LIMIT 1;

  IF admin_id IS NULL THEN
    RAISE NOTICE 'Admin user not found, skipping seed';
    RETURN;
  END IF;

  -- Post 1: Création IA
  INSERT INTO posts (id, author_id, category, content, locale) VALUES
  ('00000000-0000-0000-0000-000000000101', admin_id, 'creation',
   'Just created this cyberpunk cityscape using Midjourney v6. The level of detail is insane! Used the prompt below with --ar 16:9 --style raw. What do you think?',
   'en');

  -- Post 2: Prompt partagé
  INSERT INTO posts (id, author_id, category, content, prompt_content, locale) VALUES
  ('00000000-0000-0000-0000-000000000102', admin_id, 'prompt',
   'Here''s my go-to prompt for generating professional headshots with Stable Diffusion. Works great for LinkedIn photos!',
   'Professional headshot portrait of a [gender] [age] [ethnicity] person, wearing [clothing], soft studio lighting, shallow depth of field, neutral background, shot on Canon EOS R5, 85mm f/1.4, high resolution, photorealistic',
   'en');

  -- Post 3: Question
  INSERT INTO posts (id, author_id, category, content, locale) VALUES
  ('00000000-0000-0000-0000-000000000103', admin_id, 'question',
   'What''s the best AI tool for transcribing long meetings? I''ve tried Otter.ai but it struggles with multiple speakers. Any recommendations?',
   'en');

  -- Post 4: Discussion
  INSERT INTO posts (id, author_id, category, content, locale) VALUES
  ('00000000-0000-0000-0000-000000000104', admin_id, 'discussion',
   'Hot take: AI-generated art is not "cheating" — it''s a new medium. Just like photography wasn''t cheating when painters criticized it in the 1800s. The skill is in the prompting, curation, and creative vision. Change my mind.',
   'en');

  -- Post 5: Tool Review
  INSERT INTO posts (id, author_id, category, content, locale) VALUES
  ('00000000-0000-0000-0000-000000000105', admin_id, 'tool_review',
   'Been using Claude for coding assistance for 3 months now. Honest review: it''s incredible for explaining complex code, writing tests, and debugging. Where it falls short: very large codebases and real-time data. Overall 9/10 for developers.',
   'en');

  -- Post 6: Création IA en français
  INSERT INTO posts (id, author_id, category, content, locale) VALUES
  ('00000000-0000-0000-0000-000000000106', admin_id, 'creation',
   'J''ai généré cette série de portraits Renaissance avec DALL-E 3. Le style est bluffant, on dirait des vrais tableaux du 16e siècle. L''IA comprend vraiment les techniques de clair-obscur !',
   'fr');

  -- Quelques commentaires de démo
  INSERT INTO comments (post_id, author_id, content) VALUES
  ('00000000-0000-0000-0000-000000000103', admin_id,
   'I''ve had great results with Whisper (OpenAI). It handles multiple speakers well and it''s free to run locally!');

  INSERT INTO comments (post_id, author_id, content) VALUES
  ('00000000-0000-0000-0000-000000000104', admin_id,
   'I agree! The creativity is in how you use the tool, not just pressing a button. Prompt engineering is a real skill.');

END $$;
```

---

## Étape 7 : Commit Git

Fais un commit avec tous les nouveaux fichiers :

```
git add supabase/migrations/006_community_feed.sql supabase/migrations/007_user_premium.sql supabase/migrations/008_seed_community_posts.sql src/types/database.ts src/lib/queries/posts.ts src/messages/en.json src/messages/fr.json src/messages/es.json
```

Message de commit :
```
Add community feed database schema, types, queries, and i18n translations

Phase 2B: Social feed foundation
- Migration 006: posts, post_images, comments, likes, bookmarks tables with RLS
- Migration 007: is_premium column on users table
- Migration 008: Demo seed data (6 posts, 2 comments)
- TypeScript types for all new tables
- Supabase queries: getPosts, getPostById, getComments
- i18n translations for feed UI (EN, FR, ES)
```

---

## RAPPEL IMPORTANT

Après ce commit, je (Benjamin) dois aller dans Supabase SQL Editor et exécuter :
1. Le contenu de `006_community_feed.sql`
2. Le contenu de `007_user_premium.sql`
3. Le contenu de `008_seed_community_posts.sql`

Claude Code ne doit PAS essayer d'exécuter ces migrations directement.

---

## Prochaine session (Session 7)

On construira les composants React du feed :
- PostCard
- PostComposer
- CommentSection
- LikeButton, BookmarkButton
- Feed page avec filtres par catégorie
- Redesign de la homepage
