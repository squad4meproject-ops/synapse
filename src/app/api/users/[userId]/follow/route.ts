import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { createNotification } from '@/lib/notifications/create';

// POST /api/users/[userId]/follow — toggle follow/unfollow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params;

    // 1. Vérifier l'auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Trouver l'utilisateur interne (le follower)
    const serviceClient = createServiceClient();
    const { data: me } = await serviceClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!me) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Ne pas se suivre soi-même
    if (me.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // 4. Vérifier si déjà suivi
    const { data: existing } = await serviceClient
      .from('followers')
      .select('id')
      .eq('follower_id', me.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    if (existing) {
      // Unfollow
      await serviceClient
        .from('followers')
        .delete()
        .eq('id', existing.id);

      return NextResponse.json({ following: false });
    } else {
      // Follow
      const { error: insertError } = await serviceClient
        .from('followers')
        .insert({ follower_id: me.id, following_id: targetUserId });

      if (insertError) {
        if (insertError.code === '23505') {
          // Already following (race condition) — treat as unfollow
          await serviceClient
            .from('followers')
            .delete()
            .eq('follower_id', me.id)
            .eq('following_id', targetUserId);
          return NextResponse.json({ following: false });
        }
        console.error('Error following:', insertError);
        return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
      }

      // Notifier l'utilisateur suivi
      await createNotification({
        userId: targetUserId,
        actorId: me.id,
        type: 'follow',
      });

      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
