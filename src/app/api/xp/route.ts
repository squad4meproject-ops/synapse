import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getLevelInfo } from "@/lib/xp";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data: userData } = await serviceClient
      .from("users")
      .select("id, xp, level, level_title")
      .eq("auth_id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ xp: 0, level: 1, levelInfo: getLevelInfo(0) });
    }

    // Récupérer l'historique XP récent (10 derniers)
    const { data: recentXp } = await serviceClient
      .from("xp_events")
      .select("action, xp_amount, created_at")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const levelInfo = getLevelInfo(userData.xp || 0);

    return NextResponse.json({
      xp: userData.xp || 0,
      level: userData.level || 1,
      levelTitle: userData.level_title || "Newcomer",
      levelInfo,
      recentXp: recentXp || [],
    });
  } catch (error) {
    console.error("XP fetch error:", error);
    return NextResponse.json({ xp: 0, level: 1, levelInfo: getLevelInfo(0) });
  }
}
