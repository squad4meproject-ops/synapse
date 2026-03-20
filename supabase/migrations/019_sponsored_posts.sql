-- Ajouter les colonnes de sponsoring à la table posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sponsor_label TEXT;  -- ex: "Sponsored by OpenAI"
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sponsor_url TEXT;    -- lien du sponsor
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sponsored_until TIMESTAMPTZ;  -- date d'expiration

CREATE INDEX idx_posts_sponsored ON posts (is_sponsored, sponsored_until) WHERE is_sponsored = true;
