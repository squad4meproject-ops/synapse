import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface Space {
  id: string;
  slug: string;
  name_en: string;
  name_fr: string;
  name_es: string;
  description_en: string | null;
  description_fr: string | null;
  description_es: string | null;
  icon: string;
  color: string;
  cover_image_url: string | null;
  members_count: number;
  posts_count: number;
  is_active: boolean;
  created_at: string;
}

export async function getSpaces(): Promise<Space[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("is_active", true)
    .order("members_count", { ascending: false });

  if (error) {
    console.error("Error fetching spaces:", error);
    return [];
  }
  return (data as unknown as Space[]) || [];
}

export async function getSpaceBySlug(slug: string): Promise<Space | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as unknown as Space;
}

export async function getUserSpaces(userId: string): Promise<Space[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("space_members")
    .select("space_id, space:spaces(*)")
    .eq("user_id", userId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((sm: any) => sm.space);
}

export async function isSpaceMember(spaceId: string, userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("space_members")
    .select("id", { count: "exact", head: true })
    .eq("space_id", spaceId)
    .eq("user_id", userId);

  return (count || 0) > 0;
}
