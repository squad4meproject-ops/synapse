import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET — Messages d'une conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceClient = createServiceClient();

    // Vérifier que l'user est participant
    const { data: me } = await serviceClient
      .from('users').select('id').eq('auth_id', user.id).single();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { data: participation } = await serviceClient
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', me.id)
      .single();

    if (!participation) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Récupérer les messages
    const { data: messages } = await serviceClient
      .from('messages')
      .select(`
        id, content, created_at, sender_id,
        sender:users!messages_sender_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    // Marquer comme lu
    await serviceClient
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', me.id);

    return NextResponse.json({ messages: messages || [], myUserId: me.id });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Envoyer un message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { content } = await request.json();
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const serviceClient = createServiceClient();

    const { data: me } = await serviceClient
      .from('users').select('id').eq('auth_id', user.id).single();
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Vérifier participation
    const { data: participation } = await serviceClient
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', me.id)
      .single();

    if (!participation) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Insérer le message
    const { data: message, error } = await serviceClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: me.id,
        content: content.trim(),
      })
      .select(`
        id, content, created_at, sender_id,
        sender:users!messages_sender_id_fkey(id, display_name, username, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Mettre à jour le last_read_at de l'envoyeur
    await serviceClient
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', me.id);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
