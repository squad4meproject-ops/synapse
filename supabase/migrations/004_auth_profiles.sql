-- Migration: Auth profiles
-- Enrichit la table users pour l'intégrer avec Supabase Auth

-- 1. Ajouter les colonnes manquantes
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
  ADD COLUMN IF NOT EXISTS auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index pour lookup par auth_id
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);

-- 2. Trigger : créer automatiquement un profil quand un utilisateur s'inscrit via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. RLS policies pour les profils (la policy "Public read access" existe déjà dans 001)
-- Permettre aux utilisateurs de modifier uniquement leur propre profil
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Permettre aux utilisateurs de supprimer leur propre profil
CREATE POLICY "Users can delete own profile"
  ON public.users FOR DELETE
  USING (auth_id = auth.uid());

-- 4. GRANT les permissions nécessaires (complète ce qui existe dans 002)
-- Le SELECT et INSERT/UPDATE/DELETE pour authenticated sont déjà dans 002
-- On s'assure que le service_role peut exécuter la fonction trigger
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
