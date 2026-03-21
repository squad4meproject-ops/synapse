import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkAndAwardBadges } from '@/lib/badges/check';

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

    // 5. Extract hashtags and create tags (non-bloquant si erreur)
    if (post) {
      try {
        const hashtagRegex = /#\w+/g;
        const rawMatches = content.match(hashtagRegex) || [];
        const uniqueMatches = Array.from(new Set(rawMatches)) as string[];
        const hashtags = uniqueMatches.map(tag => tag.substring(1).toLowerCase());

        if (hashtags.length > 0) {
          // Create or get tags
          const tags: { id: string; name: string; slug: string }[] = [];

          for (const tagName of hashtags) {
            const slug = tagName.toLowerCase().replace(/[^\w-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

            // Try to find existing tag
            const { data: existingTag } = await serviceClient
              .from('tags')
              .select('*')
              .eq('slug', slug)
              .single();

            if (existingTag) {
              tags.push(existingTag as { id: string; name: string; slug: string });
            } else {
              // Create new tag
              const { data: newTag, error: tagError } = await serviceClient
                .from('tags')
                .insert({
                  name: tagName,
                  slug,
                  posts_count: 0,
                })
                .select()
                .single();

              if (!tagError && newTag) {
                tags.push(newTag as { id: string; name: string; slug: string });
              }
            }
          }

          // Create post_tags entries
          if (tags.length > 0) {
            const postTagInserts = tags.map(tag => ({
              post_id: post.id,
              tag_id: tag.id,
            }));

            const { error: ptError } = await serviceClient.from('post_tags').insert(postTagInserts);

            if (ptError) {
              console.error('Error inserting post tags:', ptError);
            } else {
              // Update posts_count for each tag via RPC-style increment
              for (const tag of tags) {
                const { data: currentTag } = await serviceClient
                  .from('tags')
                  .select('posts_count')
                  .eq('id', tag.id)
                  .single();
                if (currentTag) {
                  await serviceClient
                    .from('tags')
                    .update({ posts_count: ((currentTag as { posts_count: number }).posts_count || 0) + 1 })
                    .eq('id', tag.id);
                }
              }
            }
          }
        }
      } catch (tagErr) {
        console.error('Error processing tags:', tagErr);
      }
    }

    // Check badges (fire-and-forget)
    checkAndAwardBadges(authorId).catch(() => {});

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
