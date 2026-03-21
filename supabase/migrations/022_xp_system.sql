-- =============================================
-- SESSION 14A : Système XP / Réputation
-- =============================================

-- 1. Ajouter les colonnes XP et niveau sur la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level_title TEXT DEFAULT 'Newcomer';

-- 2. Table d'historique des gains XP
CREATE TABLE IF NOT EXISTS xp_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'post', 'comment', 'like_received_post', 'like_received_comment', 'new_follower', 'daily_login'
  xp_amount INTEGER NOT NULL,
  reference_id UUID, -- ID du post/commentaire/like concerné (optionnel)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Index pour performance
CREATE INDEX IF NOT EXISTS idx_xp_events_user_id ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created_at ON xp_events(created_at);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);

-- 4. RLS sur xp_events
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own xp events"
  ON xp_events FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Service role can insert xp events"
  ON xp_events FOR INSERT
  WITH CHECK (true);

-- 5. Ajouter la colonne category aux badges si elle n'existe pas
ALTER TABLE badges ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'manual';

-- 6. Ajouter les badges automatiques dans la table badges (s'ils n'existent pas)
INSERT INTO badges (name_en, name_fr, name_es, description_en, description_fr, description_es, icon, color, category)
VALUES
  ('First Post', 'Premier post', 'Primer post', 'Published your first post', 'A publié son premier post', 'Publicó su primer post', '📝', 'bg-blue-500', 'xp'),
  ('Socializer', 'Sociable', 'Sociable', 'Wrote 10 comments', 'A écrit 10 commentaires', 'Escribió 10 comentarios', '💬', 'bg-green-500', 'xp'),
  ('Popular', 'Populaire', 'Popular', 'Received 50 likes', 'A reçu 50 likes', 'Recibió 50 likes', '❤️', 'bg-red-500', 'xp'),
  ('Influencer', 'Influenceur', 'Influencer', 'Gained 10 followers', 'A gagné 10 abonnés', 'Ganó 10 seguidores', '🌟', 'bg-yellow-500', 'xp'),
  ('Veteran', 'Vétéran', 'Veterano', 'Reached level 5', 'A atteint le niveau 5', 'Alcanzó el nivel 5', '🏆', 'bg-purple-500', 'xp'),
  ('Legend', 'Légende', 'Leyenda', 'Reached level 7', 'A atteint le niveau 7', 'Alcanzó el nivel 7', '👑', 'bg-amber-500', 'xp')
ON CONFLICT DO NOTHING;
