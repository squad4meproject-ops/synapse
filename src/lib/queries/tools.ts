import { createClient } from "@/lib/supabase/server";
import type { AiTool } from "@/types";

interface ToolTranslationRow {
  name: string;
  description: string;
}

function applyTranslation(
  tool: AiTool & { tool_translations?: ToolTranslationRow[] },
): AiTool {
  const translation = tool.tool_translations?.[0];
  if (translation) {
    return {
      ...tool,
      name: translation.name,
      description: translation.description,
    };
  }
  return tool;
}

export async function getTools(locale: string, category?: string): Promise<AiTool[]> {
  const supabase = await createClient();

  let query = supabase
    .from("ai_tools")
    .select("*, tool_translations(name, description)")
    .eq("tool_translations.locale", locale)
    .order("name");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as (AiTool & { tool_translations?: ToolTranslationRow[] })[]).map(applyTranslation);
}

export async function getFeaturedTools(locale: string): Promise<AiTool[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_tools")
    .select("*, tool_translations(name, description)")
    .eq("tool_translations.locale", locale)
    .eq("is_featured", true)
    .order("name")
    .limit(6);

  if (error) throw error;
  return ((data ?? []) as (AiTool & { tool_translations?: ToolTranslationRow[] })[]).map(applyTranslation);
}

export async function getToolBySlug(slug: string, locale: string): Promise<AiTool | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_tools")
    .select("*, tool_translations(name, description)")
    .eq("tool_translations.locale", locale)
    .eq("slug", slug)
    .single();

  if (error) return null;
  return applyTranslation(data as AiTool & { tool_translations?: ToolTranslationRow[] });
}

export async function getToolCategories(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_tools")
    .select("category")
    .order("category");

  if (error) return [];
  const categories = Array.from(new Set((data as { category: string }[]).map((t) => t.category)));
  return categories;
}
