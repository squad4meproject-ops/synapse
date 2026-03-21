import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Trouver l'user interne
    const { data: userData } = await serviceClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ postsCount: 0, commentsCount: 0, likesReceived: 0, followersCount: 0, followingCount: 0 });
    }

    const [postsResult, commentsResult, likesResult, followersResult, followingResult] = await Promise.all([
      serviceClient.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userData.id),
      serviceClient.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', userData.id),
      serviceClient.from('posts').select('likes_count').eq('author_id', userData.id),
      serviceClient.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userData.id),
      serviceClient.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userData.id),
    ]);

    const likesReceived = (likesResult.data || []).reduce(
      (sum: number, post: Record<string, number>) => sum + (post.likes_count || 0), 0
    );

    return NextResponse.json({
      postsCount: postsResult.count || 0,
      commentsCount: commentsResult.count || 0,
      likesReceived,
      followersCount: followersResult.count || 0,
      followingCount: followingResult.count || 0,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ postsCount: 0, commentsCount: 0, likesReceived: 0, followersCount: 0, followingCount: 0 });
  }
}
