import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST /api/posts/[id]/pin — toggle pin/unpin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    // 1. Vérifier l'auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Trouver l'utilisateur interne
    const serviceClient = createServiceClient();
    const { data: userData } = await serviceClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Vérifier que le post appartient à l'utilisateur
    const { data: post } = await serviceClient
      .from('posts')
      .select('id, author_id, is_pinned')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.author_id !== userData.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Toggle pin
    const newPinned = !post.is_pinned;

    if (newPinned) {
      // Désépingler les autres posts de cet auteur d'abord
      await serviceClient
        .from('posts')
        .update({ is_pinned: false })
        .eq('author_id', userData.id)
        .eq('is_pinned', true);
    }

    // Mettre à jour le post
    const { error: updateError } = await serviceClient
      .from('posts')
      .update({ is_pinned: newPinned })
      .eq('id', postId);

    if (updateError) {
      console.error('Error toggling pin:', updateError);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ pinned: newPinned });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
