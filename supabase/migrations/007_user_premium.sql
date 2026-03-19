-- ============================================================
-- Migration 007: Add is_premium to users
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- Permet de filtrer facilement les users premium
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium) WHERE is_premium = true;
