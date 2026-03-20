import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST /api/posts — Créer un nouveau post
export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'auth avec le client normal
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, content, prompt_content, link_url, locale, image_urls } = body;

    if (!content || !category) {
      return NextResponse.json({ error: 'Content and category are required' }, { status: 400 });
    }

    // 2. Utiliser le service client pour bypasser RLS
    const serviceClient = createServiceClient();

    // Trouver l'ID de l'utilisateur dans notre table users
    const { data: userData } = await serviceClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    let authorId = userData?.id;

    if (!authorId) {
      // Fallback: chercher par email
      const { data: userByEmail } = await serviceClient
        .from('users')
        .select('id')
        .eq('email', user.email!)
        .single();

      if (!userByEmail) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }
      authorId = userByEmail.id;
    }

    // 3. Insérer le post avec le service client
    const { data: post, error } = await serviceClient
      .from('posts')
      .insert({
        author_id: authorId,
        category,
        content,
        prompt_content: prompt_content || null,
        link_url: link_url || null,
        locale: locale || 'en',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json({ error: `Failed to create post: ${error.message}` }, { status: 500 });
    }

    // 4. Insérer les images si présentes (non-bloquant si erreur)
    if (image_urls && Array.isArray(image_urls) && image_urls.length > 0 && post) {
      try {
        const imageInserts = image_urls.map((url: string, index: number) => ({
          post_id: post.id,
          image_url: url,
          position: index,
        }));
        const { error: imgError } = await serviceClient.from('post_images').insert(imageInserts);
        if (imgError) {
          console.error('Error inserting post images:', imgError);
        }
      } catch (imgErr) {
        console.error('Error inserting post images:', imgErr);
      }
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
