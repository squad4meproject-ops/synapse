-- Fix: Grant table permissions to Supabase roles
-- The initial migration created tables and RLS policies but forgot GRANT statements

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant SELECT on all tables for public read access
GRANT SELECT ON public.users TO anon, authenticated;
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT SELECT ON public.article_translations TO anon, authenticated;
GRANT SELECT ON public.ai_tools TO anon, authenticated;

-- Grant full access to service_role (bypasses RLS)
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.articles TO service_role;
GRANT ALL ON public.article_translations TO service_role;
GRANT ALL ON public.ai_tools TO service_role;

-- Grant INSERT/UPDATE/DELETE for authenticated users (RLS policies will control access)
GRANT INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.article_translations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ai_tools TO authenticated;
