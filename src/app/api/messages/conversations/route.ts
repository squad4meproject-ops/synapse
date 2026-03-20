import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET — Liste des conversations
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceClient = createServiceClient();

    // Trouver l'user interne
    const { data: me } = await serviceClient
      .from('users').select('id').eq('auth_id', user.id).single();
    if (!me) return NextResponse.json([]);

    // Récupérer les conversations de l'utilisateur
    const { data: participations } = await serviceClient
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', me.id);

    if (!participations || participations.length === 0) return NextResponse.json([]);

    const convIds = participations.map((p: { conversation_id: string }) => p.conversation_id);

    // Pour chaque conversation, récupérer l'autre participant et le dernier message
    const conversations = await Promise.all(convIds.map(async (convId: string) => {
      // Autre participant
      const { data: participants } = await serviceClient
        .from('conversation_participants')
        .select('user_id, users!conversation_participants_user_id_fkey(id, display_name, username, avatar_url)')
        .eq('conversation_id', convId)
        .neq('user_id', me.id);

      const otherUser = participants?.[0]?.users || null;

      // Dernier message
      const { data: lastMsg } = await serviceClient
        .from('messages')
        .select('content, created_at, sender_id')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Nombre de messages non lus
      const { data: myParticipation } = await serviceClient
        .from('conversation_participants')
        .select('last_read_at')
        .eq('conversation_id', convId)
        .eq('user_id', me.id)
        .single();

      let unreadCount = 0;
      if (myParticipation?.last_read_at) {
        const { count } = await serviceClient
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', convId)
          .neq('sender_id', me.id)
          .gt('created_at', myParticipation.last_read_at);
        unreadCount = count || 0;
      }

      return {
        id: convId,
        otherUser,
        lastMessage: lastMsg,
        unreadCount,
        updatedAt: lastMsg?.created_at || null,
      };
    }));

    // Trier par dernier message
    conversations.sort((a, b) =>
      new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Créer ou trouver une conversation avec un autre user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUserId } = await request.json();
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });

    const serviceClient = createServiceClient();

    // Trouver l'user interne
    const { data: me } = await serviceClient
      .from('users').select('id').eq('auth_id', user.id).single();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (me.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Vérifier si une conversation existe déjà entre ces 2 users
    const { data: myConvs } = await serviceClient
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', me.id);

    const { data: theirConvs } = await serviceClient
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', targetUserId);

    const myConvIds = new Set((myConvs || []).map((c: { conversation_id: string }) => c.conversation_id));
    const existingConvId = (theirConvs || []).find(
      (c: { conversation_id: string }) => myConvIds.has(c.conversation_id)
    )?.conversation_id;

    if (existingConvId) {
      return NextResponse.json({ conversationId: existingConvId });
    }

    // Créer une nouvelle conversation
    const { data: conv, error: convError } = await serviceClient
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError || !conv) throw convError;

    // Ajouter les 2 participants
    await serviceClient.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: me.id },
      { conversation_id: conv.id, user_id: targetUserId },
    ]);

    return NextResponse.json({ conversationId: conv.id }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
