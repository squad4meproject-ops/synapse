import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/posts/[id]/bookmark — Toggle bookmark sur un post
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

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single() as { data: { id: string } | null };

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: existingBookmark } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userData.id)
      .eq('post_id', postId)
      .maybeSingle() as { data: { id: string } | null };

    if (existingBookmark) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('bookmarks') as any).delete().eq('id', existingBookmark.id);
      return NextResponse.json({ saved: false });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('bookmarks') as any).insert({
        user_id: userData.id,
        post_id: postId,
      });
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
