import { createClient } from "@/lib/supabase/server";
import type { ArticleWithTranslation } from "@/types";

export async function getArticles(locale: string): Promise<ArticleWithTranslation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select(
      `*, article_translations!inner(title, excerpt, locale, meta_title, meta_description), users(display_name, avatar_url)`
    )
    .eq("is_published", true)
    .eq("article_translations.locale", locale)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ArticleWithTranslation[];
}

export async function getArticleBySlug(
  slug: string,
  locale: string
): Promise<ArticleWithTranslation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select(
      `*, article_translations!inner(title, excerpt, content, locale, meta_title, meta_description), users(display_name, avatar_url)`
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("article_translations.locale", locale)
    .single();

  if (error) return null;
  return data as unknown as ArticleWithTranslation;
}

export async function getArticleSlugs(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("slug")
    .eq("is_published", true);

  if (error) return [];
  return (data as { slug: string }[]).map((a) => a.slug);
}
