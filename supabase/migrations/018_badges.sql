-- Table badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  name_es TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_fr TEXT NOT NULL,
  description_es TEXT NOT NULL,
  icon TEXT NOT NULL,          -- emoji ou URL d'icône
  color TEXT NOT NULL,         -- classe CSS couleur (ex: 'bg-yellow-500')
  condition_type TEXT NOT NULL, -- 'posts_count', 'likes_received', 'comments_count', 'member_since', 'manual'
  condition_value INT,          -- ex: 10 (pour "10 posts"), 100 (pour "100 likes")
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table user_badges (quels badges un user a gagné)
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges (user_id);

-- RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Anyone can view user badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Service role manages user badges" ON user_badges FOR ALL USING (true);

GRANT SELECT ON badges TO authenticated;
GRANT SELECT ON user_badges TO authenticated;
GRANT ALL ON badges TO service_role;
GRANT ALL ON user_badges TO service_role;

-- Seed des badges de base
INSERT INTO badges (slug, name_en, name_fr, name_es, description_en, description_fr, description_es, icon, color, condition_type, condition_value) VALUES
('early-adopter', 'Early Adopter', 'Pionnier', 'Pionero', 'One of the first community members', 'Un des premiers membres', 'Uno de los primeros miembros', '🌟', 'bg-yellow-500', 'manual', NULL),
('first-post', 'First Post', 'Premier Post', 'Primer Post', 'Published your first post', 'A publié son premier post', 'Publicó su primer post', '✍️', 'bg-blue-500', 'posts_count', 1),
('contributor-10', 'Contributor', 'Contributeur', 'Contribuidor', 'Published 10 posts', 'A publié 10 posts', 'Publicó 10 posts', '📝', 'bg-green-500', 'posts_count', 10),
('popular-50', 'Popular', 'Populaire', 'Popular', 'Received 50 likes', 'A reçu 50 likes', 'Recibió 50 likes', '❤️', 'bg-red-500', 'likes_received', 50),
('popular-100', 'Superstar', 'Superstar', 'Superestrella', 'Received 100 likes', 'A reçu 100 likes', 'Recibió 100 likes', '⭐', 'bg-purple-500', 'likes_received', 100),
('commenter-20', 'Active Commenter', 'Commentateur Actif', 'Comentarista Activo', 'Written 20 comments', 'A écrit 20 commentaires', 'Escribió 20 comentarios', '💬', 'bg-indigo-500', 'comments_count', 20);
