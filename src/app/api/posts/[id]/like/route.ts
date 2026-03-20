import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/posts/[id]/like — Toggle like sur un post
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

    // Trouver l'ID utilisateur interne
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single() as { data: { id: string } | null };

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Vérifier si déjà liké
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userData.id)
      .eq('post_id', postId)
      .maybeSingle() as { data: { id: string } | null };

    if (existingLike) {
      // Unlike — supprimer le like
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabase.from('likes') as any).delete().eq('id', existingLike.id);
      if (deleteError) {
        console.error('Error deleting like:', deleteError);
        return NextResponse.json({ error: 'Failed to unlike' }, { status: 500 });
      }
      return NextResponse.json({ liked: false });
    } else {
      // Like — créer le like
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase.from('likes') as any).insert({
        user_id: userData.id,
        post_id: postId,
      });
      if (insertError) {
        console.error('Error inserting like:', insertError);
        return NextResponse.json({ error: 'Failed to like' }, { status: 500 });
      }
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
