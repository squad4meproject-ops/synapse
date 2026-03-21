import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();

  // Trouver l'espace
  const { data: space } = await supabase
    .from("spaces")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  const { data: posts, count } = await supabase
    .from("posts")
    .select("*, author:users!posts_author_id_fkey(id, display_name, username, avatar_url, level), images:post_images(id, image_url, position, alt_text), tags:post_tags(tag:tags(id, name, slug))", { count: "exact" })
    .eq("space_id", space.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({ posts: posts || [], total: count || 0 });
}
