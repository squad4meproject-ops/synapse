import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);

    if (!q || q.length < 2) {
      return NextResponse.json({ posts: [], users: [], articles: [], tools: [] });
    }

    const serviceClient = createServiceClient();
    const pattern = `%${q}%`;

    const results: {
      posts: unknown[];
      users: unknown[];
      articles: unknown[];
      tools: unknown[];
    } = { posts: [], users: [], articles: [], tools: [] };

    // Search posts
    if (type === 'all' || type === 'posts') {
      const { data } = await serviceClient
        .from('posts')
        .select(`
          id, content, created_at,
          author:users!posts_author_id_fkey(display_name, username)
        `)
        .or(`content.ilike.${pattern},prompt_content.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      results.posts = data || [];
    }

    // Search users
    if (type === 'all' || type === 'users') {
      const { data } = await serviceClient
        .from('users')
        .select('id, display_name, username, avatar_url, bio')
        .or(`display_name.ilike.${pattern},username.ilike.${pattern}`)
        .limit(limit);

      results.users = data || [];
    }

    // Search articles (via article_translations)
    if (type === 'all' || type === 'articles') {
      const { data } = await serviceClient
        .from('article_translations')
        .select('id, title, excerpt, article_id, articles!inner(id, slug)')
        .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
        .limit(limit);

      results.articles = (data || []).map((row: Record<string, unknown>) => {
        const article = row.articles as Record<string, unknown> | null;
        return {
          id: row.article_id,
          title: row.title,
          excerpt: row.excerpt,
          slug: article?.slug || '',
        };
      });
    }

    // Search tools (via tool_translations)
    if (type === 'all' || type === 'tools') {
      const { data } = await serviceClient
        .from('tool_translations')
        .select('id, name, description, tool_id, ai_tools!inner(id, slug, logo_url)')
        .or(`name.ilike.${pattern},description.ilike.${pattern}`)
        .limit(limit);

      results.tools = (data || []).map((row: Record<string, unknown>) => {
        const tool = row.ai_tools as Record<string, unknown> | null;
        return {
          id: row.tool_id,
          name: row.name,
          description: row.description,
          slug: tool?.slug || '',
          logo_url: tool?.logo_url || null,
        };
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
