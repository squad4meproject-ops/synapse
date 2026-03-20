import { createServiceClient } from '@/lib/supabase/service';

/**
 * Vérifie et attribue automatiquement les badges à un utilisateur.
 * Appelé après création de post, like, commentaire (fire-and-forget).
 */
export async function checkAndAwardBadges(userId: string) {
  try {
    const serviceClient = createServiceClient();

    // 1. Récupérer les stats de l'utilisateur
    const [postsResult, commentsResult, likesResult] = await Promise.all([
      serviceClient.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      serviceClient.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      serviceClient.from('posts').select('likes_count').eq('author_id', userId),
    ]);

    const postsCount = postsResult.count || 0;
    const commentsCount = commentsResult.count || 0;
    const likesReceived = (likesResult.data || []).reduce(
      (sum: number, post: Record<string, number>) => sum + (post.likes_count || 0), 0
    );

    // 2. Récupérer tous les badges automatiques
    const { data: badges } = await serviceClient
      .from('badges')
      .select('id, condition_type, condition_value')
      .neq('condition_type', 'manual');

    if (!badges || badges.length === 0) return;

    // 3. Récupérer les badges déjà attribués
    const { data: existingBadges } = await serviceClient
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const existingIds = new Set((existingBadges || []).map((b: { badge_id: string }) => b.badge_id));

    // 4. Vérifier chaque badge
    const toAward: { user_id: string; badge_id: string }[] = [];

    for (const badge of badges) {
      if (existingIds.has(badge.id)) continue;

      let earned = false;
      switch (badge.condition_type) {
        case 'posts_count':
          earned = postsCount >= (badge.condition_value || 0);
          break;
        case 'comments_count':
          earned = commentsCount >= (badge.condition_value || 0);
          break;
        case 'likes_received':
          earned = likesReceived >= (badge.condition_value || 0);
          break;
      }

      if (earned) {
        toAward.push({ user_id: userId, badge_id: badge.id });
      }
    }

    // 5. Attribuer les nouveaux badges
    if (toAward.length > 0) {
      const { error } = await serviceClient.from('user_badges').insert(toAward);
      if (error) {
        console.error('Error awarding badges:', error);
      }
    }
  } catch (err) {
    console.error('Error checking badges:', err);
  }
}
