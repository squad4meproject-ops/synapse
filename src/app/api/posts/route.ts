import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/posts — Créer un nouveau post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, content, prompt_content, link_url, locale } = body;

    if (!content || !category) {
      return NextResponse.json({ error: 'Content and category are required' }, { status: 400 });
    }

    // Trouver l'ID de l'utilisateur dans notre table users
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single() as { data: { id: string } | null };

    if (!userData) {
      // Fallback: chercher par email
      const { data: userByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email!)
        .single() as { data: { id: string } | null };

      if (!userByEmail) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: post, error } = await (supabase.from('posts') as any)
        .insert({
          author_id: userByEmail.id,
          category,
          content,
          prompt_content: prompt_content || null,
          link_url: link_url || null,
          locale: locale || 'en',
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(post, { status: 201 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: post, error } = await (supabase.from('posts') as any)
      .insert({
        author_id: userData.id,
        category,
        content,
        prompt_content: prompt_content || null,
        link_url: link_url || null,
        locale: locale || 'en',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
