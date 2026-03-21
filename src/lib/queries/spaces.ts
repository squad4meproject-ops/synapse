import { createServiceClient } from "@/lib/supabase/service";

export async function getSpaces() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("is_active", true)
    .order("members_count", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getSpaceBySlug(slug: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}

export async function getUserSpaces(userId: string) {
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
