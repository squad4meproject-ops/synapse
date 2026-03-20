import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET /api/notifications?limit=20&offset=0
export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier l'auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Trouver l'utilisateur interne
    const serviceClient = createServiceClient();
    const { data: userData } = await serviceClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ notifications: [], unread_count: 0, has_more: false });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // 3. Récupérer les notifications paginées avec l'acteur
    const { data: notifications, error: notifError } = await serviceClient
      .from('notifications')
      .select(`
        id, type, post_id, comment_id, conversation_id, read, created_at,
        actor:users!notifications_actor_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (notifError) {
      console.error('Error fetching notifications:', notifError);
      return NextResponse.json({ notifications: [], unread_count: 0, has_more: false });
    }

    // 4. Compter les non-lues
    const { count: unreadCount } = await serviceClient
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userData.id)
      .eq('read', false);

    // 5. Enrichir avec un aperçu du post si post_id existe
    const postIds = Array.from(
      new Set(
        (notifications || [])
          .filter((n: { post_id: string | null }) => n.post_id)
          .map((n: { post_id: string | null }) => n.post_id as string)
      )
    );

    let postPreviews: Record<string, string> = {};
    if (postIds.length > 0) {
      const { data: posts } = await serviceClient
        .from('posts')
        .select('id, content')
        .in('id', postIds);

      if (posts) {
        postPreviews = Object.fromEntries(
          posts.map((p: { id: string; content: string }) => [
            p.id,
            p.content.slice(0, 100) + (p.content.length > 100 ? '...' : ''),
          ])
        );
      }
    }

    // 6. Construire la réponse enrichie
    const enriched = (notifications || []).map((n: Record<string, unknown>) => ({
      ...n,
      post_preview: n.post_id ? postPreviews[n.post_id as string] || null : null,
    }));

    // Vérifier s'il y a plus de résultats
    const { count: totalCount } = await serviceClient
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userData.id);

    return NextResponse.json({
      notifications: enriched,
      unread_count: unreadCount || 0,
      has_more: offset + limit < (totalCount || 0),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
