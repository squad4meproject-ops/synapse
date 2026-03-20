import { NextRequest, NextResponse } from 'next/server';
import { getPosts } from '@/lib/queries/posts';
import { createClient } from '@/lib/supabase/server';
import type { PostCategory } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const category = searchParams.get('category') as PostCategory | undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
    const lang = searchParams.get('lang') || undefined;

    // Check user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userId: string | undefined;
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single() as { data: { id: string } | null };
      userId = userData?.id;
    }

    const { posts, total } = await getPosts({ page, limit, category, locale: lang, userId });

    return NextResponse.json({
      posts,
      total,
      page,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
