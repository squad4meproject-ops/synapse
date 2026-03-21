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
