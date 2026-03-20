import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

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

    const service = createServiceClient();

    const { data: userData } = await service
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: existingBookmark } = await service
      .from('bookmarks')
      .select('id')
      .eq('user_id', userData.id)
      .eq('post_id', postId)
      .maybeSingle();

    if (existingBookmark) {
      const { error: deleteError } = await service
        .from('bookmarks')
        .delete()
        .eq('id', existingBookmark.id);

      if (deleteError) {
        console.error('Error deleting bookmark:', deleteError);
        return NextResponse.json({ error: 'Failed to unsave' }, { status: 500 });
      }
      return NextResponse.json({ saved: false });
    } else {
      const { error: insertError } = await service
        .from('bookmarks')
        .insert({ user_id: userData.id, post_id: postId });

      if (insertError) {
        if (insertError.code === '23505') {
          await service.from('bookmarks').delete()
            .eq('user_id', userData.id)
            .eq('post_id', postId);
          return NextResponse.json({ saved: false });
        }
        console.error('Error inserting bookmark:', insertError);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
      }
      return NextResponse.json({ saved: true });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
