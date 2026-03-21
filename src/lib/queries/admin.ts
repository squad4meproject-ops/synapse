import { createServiceClient } from '@/lib/supabase/service';

export async function isUserAdmin(authId: string): Promise<boolean> {
  try {
    const service = createServiceClient();
    const { data } = await service
      .from('users')
      .select('is_admin')
      .eq('auth_id', authId)
      .single();

    return data?.is_admin ?? false;
  } catch {
    return false;
  }
}

export async function getAdminStats() {
  try {
    const service = createServiceClient();

    const [usersRes, postsRes, commentsRes, badgesRes] = await Promise.all([
      service.from('users').select('id', { count: 'exact' }),
      service.from('posts').select('id', { count: 'exact' }),
      service.from('comments').select('id', { count: 'exact' }),
      service.from('user_badges').select('id', { count: 'exact' }),
    ]);

    return {
      totalUsers: usersRes.count ?? 0,
      totalPosts: postsRes.count ?? 0,
      totalComments: commentsRes.count ?? 0,
      totalBadges: badgesRes.count ?? 0,
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return {
      totalUsers: 0,
      totalPosts: 0,
      totalComments: 0,
      totalBadges: 0,
    };
  }
}

export async function getAllPosts(page: number = 1, limit: number = 20) {
  try {
    const service = createServiceClient();
    const offset = (page - 1) * limit;

    const { data, error, count } = await service
      .from('posts')
      .select(
        `
        id,
        content,
        likes_count,
        comments_count,
        is_sponsored,
        created_at,
        author:users!posts_author_id_fkey(id, display_name, username, avatar_url)
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return {
      data: [],
      total: 0,
      page,
      limit,
    };
  }
}

export async function getAllUsers(page: number = 1, limit: number = 20) {
  try {
    const service = createServiceClient();
    const offset = (page - 1) * limit;

    const { data, error, count } = await service
      .from('users')
      .select(
        `
        id,
        email,
        display_name,
        username,
        avatar_url,
        is_admin,
        is_premium,
        created_at
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      data: [],
      total: 0,
      page,
      limit,
    };
  }
}

export async function getSponsoredPosts() {
  try {
    const service = createServiceClient();

    const { data, error } = await service
      .from('posts')
      .select(
        `
        id,
        content,
        is_sponsored,
        sponsor_label,
        sponsor_url,
        sponsored_until,
        created_at,
        author:users!posts_author_id_fkey(id, display_name, username, avatar_url)
        `
      )
      .eq('is_sponsored', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data ?? [];
  } catch (error) {
    console.error('Error fetching sponsored posts:', error);
    return [];
  }
}
