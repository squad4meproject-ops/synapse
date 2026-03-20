import { createClient } from '@/lib/supabase/server';
import type { Post, Comment, PostCategory } from '@/types/database';

// ============================================================
// GET POSTS (feed principal)
// ============================================================
export async function getPosts({
  page = 1,
  limit = 20,
  category,
  locale,
  userId, // pour calculer is_liked et is_saved
}: {
  page?: number;
  limit?: number;
  category?: PostCategory;
  locale?: string;
  userId?: string;
} = {}): Promise<{ posts: Post[]; total: number }> {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, display_name, username, avatar_url),
        images:post_images(id, image_url, position, alt_text),
        tool:ai_tools!posts_tool_id_fkey(id, name, slug, logo_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (locale) {
      query = query.eq('locale', locale);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    let posts = (data || []) as Post[];

    // Si un user est connecté, vérifier ses likes et bookmarks
    if (userId && posts.length > 0) {
      const postIds = posts.map(p => p.id);

      const [likesResult, bookmarksResult] = await Promise.all([
        supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds),
        supabase
          .from('bookmarks')
          .select('post_id')
          .eq('user_id', userId)
          .in('post_id', postIds),
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

    return { posts, total: count || 0 };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], total: 0 };
  }
}

// ============================================================
// GET POST BY ID
// ============================================================
export async function getPostById(postId: string, userId?: string): Promise<Post | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, display_name, username, avatar_url),
        images:post_images(id, image_url, position, alt_text),
        tool:ai_tools!posts_tool_id_fkey(id, name, slug, logo_url)
      `)
      .eq('id', postId)
      .single();

    if (error) throw error;
    if (!data) return null;

    let post = data as Post;

    if (userId) {
      const [likeResult, bookmarkResult] = await Promise.all([
        supabase
          .from('likes')
          .select('id')
          .eq('user_id', userId)
          .eq('post_id', postId)
          .maybeSingle(),
        supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', userId)
          .eq('post_id', postId)
          .maybeSingle(),
      ]);

      post = {
        ...post,
        is_liked: !!likeResult.data,
        is_saved: !!bookmarkResult.data,
        images: (post.images || []).sort((a, b) => a.position - b.position),
      };
    }

    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

// ============================================================
// GET COMMENTS FOR A POST
// ============================================================
export async function getComments(postId: string, userId?: string): Promise<Comment[]> {
  try {
    const supabase = await createClient();

    // Récupérer tous les commentaires du post
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_author_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    let comments = data as Comment[];

    // Vérifier les likes de l'user connecté
    if (userId && comments.length > 0) {
      const commentIds = comments.map(c => c.id);
      const { data: likesData } = await supabase
        .from('likes')
        .select('comment_id')
        .eq('user_id', userId)
        .in('comment_id', commentIds);

      const likedCommentIds = new Set(((likesData || []) as { comment_id: string }[]).map(l => l.comment_id));
      comments = comments.map(c => ({
        ...c,
        is_liked: likedCommentIds.has(c.id),
      }));
    }

    // Structurer en arbre : commentaires racines + replies
    const rootComments = comments.filter(c => c.parent_id === null);
    const replies = comments.filter(c => c.parent_id !== null);

    return rootComments.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_id === comment.id),
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

// ============================================================
// GET BOOKMARKED POSTS (pour un utilisateur)
// ============================================================
export async function getBookmarkedPosts(userId: string, page = 1, limit = 20) {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // Récupérer les post_ids des bookmarks
    const { data: bookmarks, error: bError } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (bError || !bookmarks || bookmarks.length === 0) {
      return { posts: [] as Post[], total: 0 };
    }

    const postIds = bookmarks.map(b => (b as { post_id: string }).post_id);

    // Récupérer les posts complets
    const { data, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, display_name, username, avatar_url),
        images:post_images(id, image_url, position, alt_text)
      `, { count: 'exact' })
      .in('id', postIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Marquer tous comme saved puisque c'est la page bookmarks
    const posts = (data || []).map(p => {
      const post = p as Post;
      return {
        ...post,
        is_saved: true,
        images: (post.images || []).sort((a, b) => a.position - b.position),
      };
    }) as Post[];

    // Vérifier les likes
    if (posts.length > 0) {
      const pIds = posts.map(p => p.id);
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', pIds);

      const likedIds = new Set(((likesData || []) as { post_id: string }[]).map(l => l.post_id));
      posts.forEach(p => { p.is_liked = likedIds.has(p.id); });
    }

    return { posts, total: count || postIds.length };
  } catch (error) {
    console.error('Error fetching bookmarked posts:', error);
    return { posts: [] as Post[], total: 0 };
  }
}
