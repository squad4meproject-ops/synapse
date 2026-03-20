-- Migration 013: User preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}';

-- Les préférences seront stockées comme :
-- {
--   "default_post_locale": "en",       -- langue par défaut des posts
--   "profile_visible": true,           -- profil visible dans les résultats
--   "email_notifications": false       -- pour le futur système de notifications
-- }
