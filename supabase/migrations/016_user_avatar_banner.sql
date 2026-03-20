-- Ajouter le champ banner_url à la table users
-- (avatar_url existe déjà dans le schéma initial)
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT;
