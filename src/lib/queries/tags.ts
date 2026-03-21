import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import type { Tag, Post } from '@/types/database';

// ============================================================
// GET POPULAR TAGS
// ============================================================
export async function getPopularTags(limit = 10): Promise<Tag[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('posts_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Tag[];
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    return [];
  }
}

// ============================================================
// GET TAG BY SLUG
// ============================================================
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data as Tag | null;
  } catch (error) {
    console.error('Error fetching tag:', error);
    return null;
  }
}

// ============================================================
// CREATE OR GET TAG
// ============================================================
export async function createOrGetTag(name: string): Promise<Tag | null> {
  try {
    const serviceClient = createServiceClient();
    const slug = name.toLowerCase().replace(/[^\w-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // Try to find existing tag
    const { data: existing } = await serviceClient
      .from('tags')
      .select('*')
      .eq('slug', slug)
      .single();

    if (existing) {
      return existing as Tag;
    }

    // Create new tag
    const { data: newTag, error } = await serviceClient
      .from('tags')
      .insert({
        name,
        slug,
        posts_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return newTag as Tag;
  } catch (error) {
    console.error('Error creating/getting tag:', error);
    return null;
  }
}

// ============================================================
// GET POSTS BY TAG
// ============================================================
export async function getPostsByTag({
  tagSlug,
  page = 1,
  limit = 20,
  userId,
}: {
  tagSlug: string;
  page?: number;
  limit?: number;
  userId?: string;
}): Promise<{ posts: Post[]; total: number; tag: Tag | null }> {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // Get tag first
    const tag = await getTagBySlug(tagSlug);
    if (!tag) {
      return { posts: [], total: 0, tag: null };
    }

    // Get post IDs for this tag
    const { data: postTagsData, error: ptError } = await supabase
      .from('post_tags')
      .select('post_id')
      .eq('tag_id', tag.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (ptError) throw ptError;
    if (!postTagsData || postTagsData.length === 0) {
      return { posts: [], total: 0, tag };
    }

    const postIds = (postTagsData as { post_id: string }[]).map(pt => pt.post_id);

    // Get full posts
    const { data: postsData, error: postsError, count } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, display_name, username, avatar_url),
        images:post_images(id, image_url, position, alt_text),
        tool:ai_tools!posts_tool_id_fkey(id, name, slug, logo_url),
        tags:post_tags(tag:tags(id, name, slug))
      `, { count: 'exact' })
      .in('id', postIds)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (postsError) throw postsError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let posts = (postsData || []).map(post => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = post as any;
      // Flatten tags from post_tags structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tags = (p.tags || []).map((pt: any) => pt.tag).filter((t: any) => t);
      return {
        ...p,
        tags,
      } as Post;
    });

    // Check likes and bookmarks if user is logged in
    if (userId && posts.length > 0) {
      const pIds = posts.map(p => p.id);

      const [likesResult, bookmarksResult] = await Promise.all([
        supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', pIds),
        supabase
          .from('bookmarks')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', pIds),
      ]);

      const likedPostIds = new Set(((likesResult.data || []) as { post_id: string }[]).map(l => l.post_id));
      const savedPostIds = new Set(((bookmarksResult.data || []) as { post_id: string }[]).map(b => b.post_id));

      posts = posts.map(post => ({
        ...post,
        is_liked: likedPostIds.has(post.id),
        is_saved: savedPostIds.has(post.id),
        images: (post.images || []).sort((a, b) => a.position - b.position),
      }));
    }

    return { posts, total: count || 0, tag };
  } catch (error) {
    console.error('Error fetching posts by tag:', error);
    return { posts: [], total: 0, tag: null };
  }
}
