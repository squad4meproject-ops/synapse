import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createNotification } from '@/lib/notifications/create';
import { checkAndAwardBadges } from '@/lib/badges/check';

// GET /api/posts/[id]/comments — Récupérer les commentaires
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const service = createServiceClient();

    const { data, error } = await service
      .from('comments')
      .select(`
        *,
        author:users!comments_author_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Add like status for logged-in users
    if (user) {
      const { data: userData } = await service
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userData) {
        const { data: userLikes } = await service
          .from('likes')
          .select('comment_id')
          .eq('user_id', userData.id)
          .in('comment_id', (data || []).map(c => c.id));

        const likedCommentIds = new Set((userLikes || []).map(l => l.comment_id));

        return NextResponse.json(
          (data || []).map(comment => ({
            ...comment,
            is_liked: likedCommentIds.has(comment.id),
          }))
        );
      }
    }

    return NextResponse.json((data || []).map(c => ({ ...c, is_liked: false })));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST /api/posts/[id]/comments — Ajouter un commentaire
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, parent_id } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const service = createServiceClient();

    const { data: userData } = await service
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: comment, error } = await service
      .from('comments')
      .insert({
        post_id: postId,
        author_id: userData.id,
        content: content.trim(),
        parent_id: parent_id || null,
      })
      .select(`
        *,
        author:users!comments_author_id_fkey(id, display_name, username, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to comment' }, { status: 500 });
    }

    // Notifier l'auteur du post
    const { data: post } = await service
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (post) {
      await createNotification({
        userId: post.author_id,
        actorId: userData.id,
        type: 'comment',
        postId,
        commentId: comment.id,
      });
    }

    // Si c'est une réponse, notifier l'auteur du commentaire parent
    if (parent_id) {
      const { data: parentComment } = await service
        .from('comments')
        .select('author_id')
        .eq('id', parent_id)
        .single();

      if (parentComment && (!post || parentComment.author_id !== post.author_id)) {
        await createNotification({
          userId: parentComment.author_id,
          actorId: userData.id,
          type: 'reply',
          postId,
          commentId: comment.id,
        });
      }
    }

    // Check badges for commenter (fire-and-forget)
    checkAndAwardBadges(userData.id).catch(() => {});

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
