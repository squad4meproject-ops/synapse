import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client avec la clé service_role — BYPASS RLS
// Utiliser UNIQUEMENT dans les API routes serveur, APRÈS vérification auth
// Note: pas de generic Database pour éviter les problèmes de résolution de types
// sur les tables communautaires (likes, bookmarks, comments, posts)
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
