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
