import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  // Trouver l'utilisateur interne
  const { data: internalUser } = await serviceClient
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!internalUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Trouver l'espace
  const { data: space } = await serviceClient
    .from("spaces")
    .select("id, members_count")
    .eq("slug", slug)
    .single();

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  // Vérifier si déjà membre
  const { count } = await serviceClient
    .from("space_members")
    .select("id", { count: "exact", head: true })
    .eq("space_id", space.id)
    .eq("user_id", internalUser.id);

  if ((count || 0) > 0) {
    // Quitter l'espace
    await serviceClient
      .from("space_members")
      .delete()
      .eq("space_id", space.id)
      .eq("user_id", internalUser.id);

    await serviceClient
      .from("spaces")
      .update({ members_count: Math.max(0, (space.members_count || 0) - 1) })
      .eq("id", space.id);

    return NextResponse.json({ joined: false });
  } else {
    // Rejoindre l'espace
    await serviceClient
      .from("space_members")
      .insert({ space_id: space.id, user_id: internalUser.id });

    await serviceClient
      .from("spaces")
      .update({ members_count: (space.members_count || 0) + 1 })
      .eq("id", space.id);

    return NextResponse.json({ joined: true });
  }
}
