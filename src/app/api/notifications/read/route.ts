import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST /api/notifications/read
// Body: { ids: ["uuid1", "uuid2"] } pour marquer des notifications spécifiques
// Body: {} pour marquer TOUTES les non-lues
export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Lire le body (optionnel)
    let ids: string[] | undefined;
    try {
      const body = await request.json();
      if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
        ids = body.ids;
      }
    } catch {
      // Body vide ou invalide → marquer tout comme lu
    }

    // 4. Mettre à jour
    let query = serviceClient
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userData.id)
      .eq('read', false);

    if (ids) {
      query = query.in('id', ids);
    }

    const { error: updateError } = await query;

    if (updateError) {
      console.error('Error marking notifications as read:', updateError);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
