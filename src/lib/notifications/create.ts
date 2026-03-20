import { createServiceClient } from '@/lib/supabase/service';

type NotificationType = 'like' | 'comment' | 'reply' | 'message' | 'follow';

interface CreateNotificationParams {
  userId: string;       // Destinataire (users.id)
  actorId: string;      // Qui a déclenché (users.id)
  type: NotificationType;
  postId?: string;
  commentId?: string;
  conversationId?: string;
}

/**
 * Crée UNE notification. Ne notifie jamais l'utilisateur de ses propres actions.
 * Les erreurs sont catchées silencieusement (les notifications sont non-critiques).
 */
export async function createNotification(params: CreateNotificationParams) {
  // Ne jamais notifier soi-même
  if (params.userId === params.actorId) return;

  try {
    const serviceClient = createServiceClient();
    const { error } = await serviceClient.from('notifications').insert({
      user_id: params.userId,
      actor_id: params.actorId,
      type: params.type,
      post_id: params.postId || null,
      comment_id: params.commentId || null,
      conversation_id: params.conversationId || null,
    });

    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

/**
 * Crée PLUSIEURS notifications en batch.
 * Filtre automatiquement les auto-notifications.
 */
export async function createNotifications(paramsList: CreateNotificationParams[]) {
  // Filtrer les auto-notifications
  const filtered = paramsList.filter(p => p.userId !== p.actorId);
  if (filtered.length === 0) return;

  try {
    const serviceClient = createServiceClient();
    const inserts = filtered.map(p => ({
      user_id: p.userId,
      actor_id: p.actorId,
      type: p.type,
      post_id: p.postId || null,
      comment_id: p.commentId || null,
      conversation_id: p.conversationId || null,
    }));

    const { error } = await serviceClient.from('notifications').insert(inserts);

    if (error) {
      console.error('Error creating notifications:', error);
    }
  } catch (err) {
    console.error('Error creating notifications:', err);
  }
}
