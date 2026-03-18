import { createClient } from "@/lib/supabase/server";
import type { AiTool } from "@/types";

export async function getTools(category?: string): Promise<AiTool[]> {
  const supabase = await createClient();

  let query = supabase.from("ai_tools").select("*").order("name");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AiTool[];
}

export async function getFeaturedTools(): Promise<AiTool[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_tools")
    .select("*")
    .eq("is_featured", true)
    .order("name")
    .limit(6);

  if (error) throw error;
  return (data ?? []) as AiTool[];
}

export async function getToolBySlug(slug: string): Promise<AiTool | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_tools")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as AiTool;
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
