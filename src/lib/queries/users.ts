import { createClient } from "@/lib/supabase/server";

export async function getUserProfile(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

interface SocialLink {
  label: string;
  url: string;
}

interface PublicProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  show_email: boolean;
  email: string | null;
  is_premium: boolean;
  banner_url: string | null;
  social_links: SocialLink[];
  xp: number;
  level: number;
  level_title: string | null;
}

export async function getUserByUsername(username: string): Promise<PublicProfile | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('users') as any)
    .select('id, display_name, username, avatar_url, banner_url, bio, created_at, show_email, email, is_premium, social_links, xp, level, level_title')
    .eq('username', username)
    .single();

  if (error || !data) return null;

  const profile = data as PublicProfile;

  // Ne pas exposer l'email si show_email est false
  if (!profile.show_email) {
    profile.email = null;
  }

  return profile;
}

export async function getUserPosts(userId: string, page = 1, limit = 20) {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, count } = await (supabase.from('posts') as any)
    .select(`
      *,
      author:users!posts_author_id_fkey(id, display_name, username, avatar_url, level),
      images:post_images(id, image_url, position, alt_text)
    `, { count: 'exact' })
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return { posts: [], total: 0 };
  return { posts: data || [], total: count || 0 };
}

export async function getUserStats(userId: string) {
  const supabase = await createClient();

  const [postsResult, commentsResult, likesResult] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId),
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', userId),
    supabase.from('posts').select('likes_count').eq('author_id', userId),
  ]);

  const postsCount = postsResult.count || 0;
  const commentsCount = commentsResult.count || 0;
  const likesReceived = (likesResult.data || []).reduce(
    (sum: number, post: Record<string, number>) => sum + (post.likes_count || 0), 0
  );

  return { postsCount, commentsCount, likesReceived };
}

export async function getUserLikedPosts(userId: string, page = 1, limit = 20) {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // Get post IDs liked by user
  const { data: likes, error: likesError } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (likesError || !likes || likes.length === 0) {
    return { posts: [], total: 0 };
  }

  const postIds = likes.map((l: { post_id: string | null }) => l.post_id).filter(Boolean) as string[];
  if (postIds.length === 0) return { posts: [], total: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('posts') as any)
    .select(`
      *,
      author:users!posts_author_id_fkey(id, display_name, username, avatar_url, level),
      images:post_images(id, image_url, position, alt_text)
    `)
    .in('id', postIds);

  if (error) return { posts: [], total: 0 };
  return { posts: data || [], total: postIds.length };
}

export async function getFollowStats(userId: string, viewerId?: string) {
  const supabase = await createClient();

  const [followersResult, followingResult] = await Promise.all([
    supabase.from('followers').select('id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('followers').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);

  let isFollowing = false;
  if (viewerId && viewerId !== userId) {
    const { data } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', viewerId)
      .eq('following_id', userId)
      .maybeSingle();
    isFollowing = !!data;
  }

  return {
    followersCount: followersResult.count || 0,
    followingCount: followingResult.count || 0,
    isFollowing,
  };
}

export interface UserBadge {
  id: string;
  awarded_at: string;
  badge: {
    id: string;
    slug: string;
    name_en: string;
    name_fr: string;
    name_es: string;
    description_en: string;
    description_fr: string;
    description_es: string;
    icon: string;
    color: string;
  };
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      id, awarded_at,
      badge:badges!user_badges_badge_id_fkey(id, slug, name_en, name_fr, name_es, description_en, description_fr, description_es, icon, color)
    `)
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false });

  if (error || !data) return [];
  return data as unknown as UserBadge[];
}
