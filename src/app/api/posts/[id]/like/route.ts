import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createNotification } from '@/lib/notifications/create';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    // 1. Vérifier l'auth avec le client normal (cookies)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Utiliser le service client pour les mutations (bypass RLS)
    const service = createServiceClient();

    // 3. Trouver l'utilisateur interne
    const { data: userData } = await service
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Vérifier si déjà liké
    const { data: existingLike } = await service
      .from('likes')
      .select('id')
      .eq('user_id', userData.id)
      .eq('post_id', postId)
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
      return NextResponse.json({ liked: false });
    } else {
      // Like
      const { error: insertError } = await service
        .from('likes')
        .insert({ user_id: userData.id, post_id: postId });

      if (insertError) {
        // Si déjà liké (constraint unique), traiter comme un unlike
        if (insertError.code === '23505') {
          await service.from('likes').delete()
            .eq('user_id', userData.id)
            .eq('post_id', postId);
          return NextResponse.json({ liked: false });
        }
        console.error('Error inserting like:', insertError);
        return NextResponse.json({ error: 'Failed to like' }, { status: 500 });
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
          type: 'like',
          postId,
        });
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
