import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createNotification } from '@/lib/notifications/create';
import { checkAndAwardBadges } from '@/lib/badges/check';
import { awardXP } from '@/lib/xp';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;

    // 1. Check auth with normal client (cookies)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Use service client for mutations (bypass RLS)
    const service = createServiceClient();

    // 3. Find internal user
    const { data: userData } = await service
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Check if already liked
    const { data: existingLike } = await service
      .from('likes')
      .select('id')
      .eq('user_id', userData.id)
      .eq('comment_id', commentId)
      .maybeSingle();

    if (existingLike) {
      // Unlike
      const { error: deleteError } = await service
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('Error deleting like:', deleteError);
        return NextResponse.json({ error: 'Failed to unlike' }, { status: 500 });
      }

      // Decrement likes_count
      const { data: commentData } = await service
        .from('comments')
        .select('likes_count')
        .eq('id', commentId)
        .single();

      if (commentData) {
        await service
          .from('comments')
          .update({ likes_count: Math.max(0, (commentData.likes_count || 1) - 1) })
          .eq('id', commentId);
      }

      return NextResponse.json({ liked: false });
    } else {
      // Like
      const { error: insertError } = await service
        .from('likes')
        .insert({ user_id: userData.id, comment_id: commentId });

      if (insertError) {
        // If already liked (unique constraint), treat as unlike
        if (insertError.code === '23505') {
          await service.from('likes').delete()
            .eq('user_id', userData.id)
            .eq('comment_id', commentId);
          return NextResponse.json({ liked: false });
        }
        console.error('Error inserting like:', insertError);
        return NextResponse.json({ error: 'Failed to like' }, { status: 500 });
      }

      // Increment likes_count
      const { data: comment } = await service
        .from('comments')
        .select('likes_count, author_id, post_id')
        .eq('id', commentId)
        .single();

      if (comment) {
        await service
          .from('comments')
          .update({ likes_count: (comment.likes_count || 0) + 1 })
          .eq('id', commentId);

        // Notify comment author
        await createNotification({
          userId: comment.author_id,
          actorId: userData.id,
          type: 'like',
          postId: comment.post_id,
          commentId,
        });

        // Award XP to comment author for receiving a like (fire-and-forget)
        if (comment.author_id !== userData.id) {
          awardXP(comment.author_id, "like_received_comment", commentId).catch(() => {});
        }

        // Check badges for comment author (fire-and-forget)
        checkAndAwardBadges(comment.author_id).catch(() => {});
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
