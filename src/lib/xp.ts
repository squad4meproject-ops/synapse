import { createServiceClient } from "@/lib/supabase/service";

// Barème XP
const XP_VALUES: Record<string, number> = {
  post: 10,
  comment: 5,
  like_received_post: 3,
  like_received_comment: 2,
  new_follower: 5,
  daily_login: 2,
};

// Table des niveaux
const LEVELS = [
  { level: 1, xpMin: 0, titleEn: "Newcomer", titleFr: "Débutant", titleEs: "Novato" },
  { level: 2, xpMin: 50, titleEn: "Explorer", titleFr: "Explorateur", titleEs: "Explorador" },
  { level: 3, xpMin: 150, titleEn: "Contributor", titleFr: "Contributeur", titleEs: "Contribuidor" },
  { level: 4, xpMin: 400, titleEn: "Active Member", titleFr: "Membre actif", titleEs: "Miembro activo" },
  { level: 5, xpMin: 800, titleEn: "Expert", titleFr: "Expert", titleEs: "Experto" },
  { level: 6, xpMin: 1500, titleEn: "Master", titleFr: "Maître", titleEs: "Maestro" },
  { level: 7, xpMin: 3000, titleEn: "Legend", titleFr: "Légende", titleEs: "Leyenda" },
];

// Badges automatiques (name_en => condition)
const AUTO_BADGES: { nameEn: string; check: (stats: UserStats) => boolean }[] = [
  { nameEn: "First Post", check: (s) => s.postsCount >= 1 },
  { nameEn: "Socializer", check: (s) => s.commentsCount >= 10 },
  { nameEn: "Popular", check: (s) => s.totalLikesReceived >= 50 },
  { nameEn: "Influencer", check: (s) => s.followersCount >= 10 },
  { nameEn: "Veteran", check: (s) => s.level >= 5 },
  { nameEn: "Legend", check: (s) => s.level >= 7 },
];

interface UserStats {
  postsCount: number;
  commentsCount: number;
  totalLikesReceived: number;
  followersCount: number;
  level: number;
}

function calculateLevel(xp: number): { level: number; xpMin: number; titleEn: string; titleFr: string; titleEs: string } {
  let result = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.xpMin) result = l;
  }
  return result;
}

export function getLevelInfo(xp: number) {
  const current = calculateLevel(xp);
  const nextLevel = LEVELS.find((l) => l.level === current.level + 1);
  const xpForNext = nextLevel ? nextLevel.xpMin : null;
  const xpProgress = nextLevel ? xp - current.xpMin : xp;
  const xpNeeded = nextLevel ? nextLevel.xpMin - current.xpMin : 0;
  return { ...current, xpForNext, xpProgress, xpNeeded };
}

export async function awardXP(userId: string, action: string, referenceId?: string): Promise<{ newXp: number; newLevel: number; leveledUp: boolean }> {
  const xpAmount = XP_VALUES[action];
  if (!xpAmount) return { newXp: 0, newLevel: 1, leveledUp: false };

  const supabase = createServiceClient();

  // 1. Enregistrer l'événement XP
  await supabase.from("xp_events").insert({
    user_id: userId,
    action,
    xp_amount: xpAmount,
    reference_id: referenceId || null,
  });

  // 2. Récupérer l'XP actuel
  const { data: user } = await supabase
    .from("users")
    .select("xp, level")
    .eq("id", userId)
    .single();

  const currentXp = (user?.xp || 0) + xpAmount;
  const oldLevel = user?.level || 1;
  const newLevelInfo = calculateLevel(currentXp);

  // 3. Mettre à jour l'utilisateur
  await supabase
    .from("users")
    .update({
      xp: currentXp,
      level: newLevelInfo.level,
      level_title: newLevelInfo.titleEn,
    })
    .eq("id", userId);

  // 4. Vérifier et attribuer des badges automatiques
  await checkAndAwardBadges(userId, supabase);

  return {
    newXp: currentXp,
    newLevel: newLevelInfo.level,
    leveledUp: newLevelInfo.level > oldLevel,
  };
}

async function checkAndAwardBadges(userId: string, supabase: ReturnType<typeof createServiceClient>) {
  // Récupérer les stats de l'utilisateur
  const [postsRes, commentsRes, likesRes, followersRes, userRes] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", userId),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("author_id", userId),
    supabase.from("posts").select("likes_count").eq("author_id", userId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("users").select("level").eq("id", userId).single(),
  ]);

  const totalLikes = (likesRes.data || []).reduce(
    (sum: number, p: Record<string, number>) => sum + (p.likes_count || 0), 0
  );

  const stats: UserStats = {
    postsCount: postsRes.count || 0,
    commentsCount: commentsRes.count || 0,
    totalLikesReceived: totalLikes,
    followersCount: followersRes.count || 0,
    level: userRes.data?.level || 1,
  };

  // Récupérer les badges déjà attribués
  const { data: existingBadges } = await supabase
    .from("user_badges")
    .select("badge_id, badge:badges(name_en)")
    .eq("user_id", userId);

  const existingNames = (existingBadges || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ub: any) => ub.badge?.name_en ?? ub.badge?.[0]?.name_en
  );

  // Vérifier chaque badge auto
  for (const autoBadge of AUTO_BADGES) {
    if (existingNames.includes(autoBadge.nameEn)) continue;
    if (!autoBadge.check(stats)) continue;

    // Trouver le badge dans la table
    const { data: badge } = await supabase
      .from("badges")
      .select("id")
      .eq("name_en", autoBadge.nameEn)
      .single();

    if (badge) {
      await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
      });
    }
  }
}
