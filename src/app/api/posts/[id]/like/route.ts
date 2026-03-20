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

    // Trouver l'ID utilisateur
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .or(`auth_id.eq.${user.id},email.eq.${user.email}`)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Vérifier si déjà liké
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userData.id)
      .eq('post_id', postId)
      .maybeSingle();

    if (existingLike) {
      // Unlike
      await supabase.from('likes').delete().eq('id', existingLike.id);
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await supabase.from('likes').insert({
        user_id: userData.id,
        post_id: postId,
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
