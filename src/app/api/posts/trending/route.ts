import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/posts/trending — top 5 posts des dernières 48h par score
export async function GET() {
  try {
    const serviceClient = createServiceClient();

    // Posts des dernières 48h
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data, error } = await serviceClient
      .from('posts')
      .select(`
        id, content, likes_count, comments_count, created_at,
        author:users!posts_author_id_fkey(id, display_name, username, avatar_url)
      `)
      .gte('created_at', since)
      .order('likes_count', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching trending:', error);
      return NextResponse.json({ posts: [] });
    }

    // Calculer le score et trier
    const scored = (data || []).map((post: Record<string, unknown>) => ({
      ...post,
      score: ((post.likes_count as number) || 0) * 2 + ((post.comments_count as number) || 0) * 3,
    }));

    scored.sort((a, b) => b.score - a.score);

    return NextResponse.json({ posts: scored.slice(0, 5) });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ posts: [] });
  }
}
