# SESSION 10 — Système de Notifications

## Contexte
Synapse est une plateforme communautaire IA (Next.js 14 App Router + TypeScript + Tailwind CSS + Supabase).
On ajoute un système de notifications complet pour informer les utilisateurs quand quelqu'un interagit avec leur contenu.

## Rappel des règles du projet
- `users.id` ≠ `auth.uid()`. Le mapping se fait via `users.auth_id = auth.uid()` (type UUID, PAS text)
- Ne JAMAIS caster `auth.uid()` en `::text`
- Les API routes utilisent `createClient()` pour vérifier l'auth, puis `createServiceClient()` (service_role) pour bypass RLS
- Toujours ajouter les nouvelles clés de traduction dans les 3 fichiers (en.json, fr.json, es.json)
- `setRequestLocale(locale)` requis dans chaque server component
- Utiliser `Array.from(new Set(...))` au lieu de `[...new Set(...)]` (tsconfig ne supporte pas downlevelIteration)

## Types de notifications
1. **like** — Quelqu'un a aimé votre post
2. **comment** — Quelqu'un a commenté votre post
3. **reply** — Quelqu'un a répondu à votre commentaire
4. **message** — Nouveau message privé
5. **follow** — Quelqu'un vous suit (préparation pour session future, pas encore utilisé)

---

## ÉTAPE 1 — Migration Supabase (fichier à créer : `supabase/migrations/015_notifications.sql`)

**⚠️ Cette migration sera exécutée manuellement par le développeur sur Supabase. Claude Code doit juste créer le fichier.**

```sql
-- ============================================
-- SESSION 10: Système de notifications
-- ============================================

-- Type enum pour les notifications
CREATE TYPE notification_type AS ENUM ('like', 'comment', 'reply', 'message', 'follow');

-- Table notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, read, created_at DESC);
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_actor ON notifications (actor_id);

-- Contrainte : ne pas se notifier soi-même
ALTER TABLE notifications ADD CONSTRAINT notifications_no_self_notify CHECK (user_id != actor_id);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

GRANT SELECT, UPDATE, DELETE ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;
```

---

## ÉTAPE 2 — Helper de création de notifications (fichier : `src/lib/notifications/create.ts`)

Créer un helper réutilisable avec deux fonctions :

- `createNotification(params)` — crée UNE notification (utilisé pour likes, comments)
- `createNotifications(params[])` — crée PLUSIEURS notifications en batch (utilisé pour messages)

**Règles importantes :**
- Ne JAMAIS notifier l'utilisateur de ses propres actions (`if (userId === actorId) return`)
- Utiliser `createServiceClient()` pour l'insertion (bypass RLS)
- Catch les erreurs sans bloquer l'action principale (les notifications sont non-critiques)

**Interface des params :**
```typescript
type NotificationType = 'like' | 'comment' | 'reply' | 'message' | 'follow';

interface CreateNotificationParams {
  userId: string;       // Destinataire (users.id)
  actorId: string;      // Qui a déclenché (users.id)
  type: NotificationType;
  postId?: string;
  commentId?: string;
  conversationId?: string;
}
```

---

## ÉTAPE 3 — API Route GET `/api/notifications/route.ts`

**Endpoint : GET /api/notifications?limit=20&offset=0**

Fonctionnalités :
1. Vérifier l'auth avec `createClient()` → `supabase.auth.getUser()`
2. Trouver l'utilisateur interne via `users.auth_id = user.id`
3. Récupérer les notifications paginées avec un JOIN sur `users` (pour l'acteur : display_name, username, avatar_url)
4. Compter les notifications non-lues séparément (`count: 'exact', head: true`)
5. Enrichir avec un aperçu du post (les 100 premiers caractères du content) si `post_id` existe
6. **Important :** utiliser `Array.from(new Set(...))` pour dédupliquer les postIds, pas `[...new Set()]`

**Format de réponse :**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "like",
      "post_id": "uuid",
      "comment_id": null,
      "conversation_id": null,
      "read": false,
      "created_at": "ISO date",
      "actor": { "id": "uuid", "display_name": "John", "username": "john", "avatar_url": "..." },
      "post_preview": "Les 100 premiers caractères du post..."
    }
  ],
  "unread_count": 5,
  "has_more": true
}
```

---

## ÉTAPE 4 — API Route POST `/api/notifications/read/route.ts`

**Endpoint : POST /api/notifications/read**

Body JSON (optionnel) :
- `{ ids: ["uuid1", "uuid2"] }` → marquer ces notifications spécifiques comme lues
- `{}` (body vide) → marquer TOUTES les notifications non-lues comme lues

Fonctionnalités :
1. Vérifier l'auth
2. Trouver l'utilisateur interne
3. UPDATE notifications SET read = true WHERE user_id = ... AND read = false (+ filtre par ids si fournis)
4. Utiliser `createServiceClient()` pour la mutation

---

## ÉTAPE 5 — Intégrer la création de notifications dans les API existantes

### 5a. Dans `src/app/api/posts/[id]/like/route.ts`
- Ajouter `import { createNotification } from '@/lib/notifications/create'`
- **Après** l'insertion réussie du like (dans le bloc `else` qui fait l'insert), récupérer l'`author_id` du post et créer une notification de type `'like'`
- Ne PAS notifier sur un unlike (bloc de suppression)

### 5b. Dans `src/app/api/posts/[id]/comments/route.ts`
- Ajouter `import { createNotification } from '@/lib/notifications/create'`
- **Après** la création réussie du commentaire :
  1. Récupérer l'`author_id` du post → notifier avec type `'comment'`
  2. Si `parent_id` existe (c'est une réponse), récupérer l'`author_id` du commentaire parent → notifier avec type `'reply'` (mais SEULEMENT si c'est un auteur différent de l'auteur du post, pour éviter la double notification)

### 5c. Dans `src/app/api/messages/[conversationId]/route.ts`
- Ajouter `import { createNotifications } from '@/lib/notifications/create'`
- **Après** l'envoi réussi du message, récupérer tous les `conversation_participants` du `conversationId` sauf l'envoyeur (`neq('user_id', me.id)`) → créer une notification de type `'message'` pour chacun avec `conversationId`

---

## ÉTAPE 6 — Composant NotificationBell (`src/components/notifications/NotificationBell.tsx`)

**Composant client ('use client')** qui affiche :
- Une icône cloche (SVG) avec un badge rouge montrant le nombre de non-lues (style: `bg-red-500`, texte blanc, `99+` si > 99)
- Un dropdown qui s'ouvre au clic avec :
  - Header : titre "Notifications" + bouton "Tout marquer comme lu"
  - Liste des 10 dernières notifications avec : avatar de l'acteur, texte descriptif, aperçu du post, temps relatif ("il y a 5 min"), dot bleu pour non-lues
  - État vide : icône cloche grise + texte "Aucune notification"
  - Footer : lien "Voir toutes les notifications" → `/notifications`

**Comportement :**
- Polling toutes les 30 secondes via `setInterval` + `fetch('/api/notifications?limit=10')`
- Clic sur une notification → marquer comme lue (appel API) + navigation (vers `/messages` pour les messages, vers `/feed#post-{id}` pour les likes/comments)
- Clic en dehors du dropdown → fermer (via `useRef` + `mousedown` event listener)
- Utiliser `useTranslations('notifications')` pour toutes les chaînes

**Design :**
- Dropdown : `w-80 sm:w-96`, `rounded-xl`, `border border-gray-200`, `shadow-card`, `bg-white`
- Notification non-lue : `bg-primary-50/50`
- Badge : `absolute -right-0.5 -top-0.5`, `bg-red-500`, `text-[10px] font-bold text-white`

---

## ÉTAPE 7 — NotificationBellWrapper (`src/components/notifications/NotificationBellWrapper.tsx`)

**Composant client** qui vérifie si l'utilisateur est connecté avant d'afficher le NotificationBell.
- Utiliser `createClient` depuis `@/lib/supabase/client` (le client browser, PAS le server)
- `useEffect` → `supabase.auth.getUser()` → si connecté, afficher `<NotificationBell />`
- Si pas connecté, retourner `null`

---

## ÉTAPE 8 — Intégrer dans le Header (`src/components/layout/Header.tsx`)

- Importer `NotificationBellWrapper`
- L'ajouter dans le `<div className="hidden items-center gap-3 md:flex">`, AVANT le `<LocaleSwitcher />`

```tsx
<div className="hidden items-center gap-3 md:flex">
  <NotificationBellWrapper />   {/* ← AJOUTER ICI */}
  <LocaleSwitcher />
  <AuthButton />
</div>
```

---

## ÉTAPE 9 — Page Notifications (`src/app/[locale]/notifications/page.tsx`)

### Server component (page.tsx)
- `setRequestLocale(locale)` obligatoire
- Rendre un composant client `NotificationsPageClient`

### Client component (NotificationsPageClient.tsx)
Page complète avec :
- Titre "Toutes les notifications" + compteur de non-lues + bouton "Tout marquer comme lu"
- **Filtres horizontaux** (boutons pills) : Toutes / Non lues / Likes / Commentaires / Messages
  - Filtrage côté client sur les données déjà chargées
  - Style actif : `bg-primary-600 text-white`, inactif : `bg-gray-100 text-gray-600`
- **Liste de notifications** dans une card (`rounded-xl border shadow-card`)
  - Chaque notification = bouton cliquable avec avatar, texte, aperçu, temps, dot non-lu
  - Clic → marquer comme lu + naviguer
- **État vide** : icône cloche + titre "Vous êtes à jour !" + description
- **Bouton "Charger plus"** si `has_more = true`
- Pagination via offset (fetch 20 à la fois)

---

## ÉTAPE 10 — Traductions (les 3 fichiers)

Ajouter une section `"notifications"` à la fin de chaque fichier JSON (AVANT la dernière accolade fermante `}`).

### en.json
```json
"notifications": {
  "notifications": "Notifications",
  "markAllAsRead": "Mark all as read",
  "noNotifications": "No notifications yet",
  "viewAll": "View all notifications",
  "someone": "Someone",
  "likedYourPost": "{name} liked your post",
  "commentedOnYourPost": "{name} commented on your post",
  "repliedToYourComment": "{name} replied to your comment",
  "sentYouAMessage": "{name} sent you a message",
  "startedFollowingYou": "{name} started following you",
  "newNotification": "New notification",
  "justNow": "Just now",
  "minutesAgo": "{count}m ago",
  "hoursAgo": "{count}h ago",
  "daysAgo": "{count}d ago",
  "title": "All Notifications",
  "empty": "You're all caught up!",
  "emptyDescription": "No notifications to display. Interact with the community to start receiving notifications.",
  "loadMore": "Load more",
  "filterAll": "All",
  "filterUnread": "Unread",
  "filterLikes": "Likes",
  "filterComments": "Comments",
  "filterMessages": "Messages"
}
```

### fr.json
```json
"notifications": {
  "notifications": "Notifications",
  "markAllAsRead": "Tout marquer comme lu",
  "noNotifications": "Aucune notification",
  "viewAll": "Voir toutes les notifications",
  "someone": "Quelqu'un",
  "likedYourPost": "{name} a aimé votre post",
  "commentedOnYourPost": "{name} a commenté votre post",
  "repliedToYourComment": "{name} a répondu à votre commentaire",
  "sentYouAMessage": "{name} vous a envoyé un message",
  "startedFollowingYou": "{name} a commencé à vous suivre",
  "newNotification": "Nouvelle notification",
  "justNow": "À l'instant",
  "minutesAgo": "Il y a {count} min",
  "hoursAgo": "Il y a {count} h",
  "daysAgo": "Il y a {count} j",
  "title": "Toutes les notifications",
  "empty": "Vous êtes à jour !",
  "emptyDescription": "Aucune notification à afficher. Interagissez avec la communauté pour commencer à recevoir des notifications.",
  "loadMore": "Charger plus",
  "filterAll": "Toutes",
  "filterUnread": "Non lues",
  "filterLikes": "J'aime",
  "filterComments": "Commentaires",
  "filterMessages": "Messages"
}
```

### es.json
```json
"notifications": {
  "notifications": "Notificaciones",
  "markAllAsRead": "Marcar todo como leído",
  "noNotifications": "Sin notificaciones",
  "viewAll": "Ver todas las notificaciones",
  "someone": "Alguien",
  "likedYourPost": "{name} le gustó tu publicación",
  "commentedOnYourPost": "{name} comentó en tu publicación",
  "repliedToYourComment": "{name} respondió a tu comentario",
  "sentYouAMessage": "{name} te envió un mensaje",
  "startedFollowingYou": "{name} comenzó a seguirte",
  "newNotification": "Nueva notificación",
  "justNow": "Ahora mismo",
  "minutesAgo": "Hace {count} min",
  "hoursAgo": "Hace {count} h",
  "daysAgo": "Hace {count} d",
  "title": "Todas las notificaciones",
  "empty": "¡Estás al día!",
  "emptyDescription": "No hay notificaciones. Interactúa con la comunidad para empezar a recibir notificaciones.",
  "loadMore": "Cargar más",
  "filterAll": "Todas",
  "filterUnread": "No leídas",
  "filterLikes": "Me gusta",
  "filterComments": "Comentarios",
  "filterMessages": "Mensajes"
}
```

---

## ÉTAPE 11 — Vérification

1. Lancer `npx tsc --noEmit` et corriger toutes les erreurs TypeScript
2. Vérifier que tous les imports sont corrects
3. S'assurer que les fichiers de traduction sont du JSON valide

---

## Résumé des fichiers à créer
- `supabase/migrations/015_notifications.sql`
- `src/lib/notifications/create.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/read/route.ts`
- `src/components/notifications/NotificationBell.tsx`
- `src/components/notifications/NotificationBellWrapper.tsx`
- `src/app/[locale]/notifications/page.tsx`
- `src/app/[locale]/notifications/NotificationsPageClient.tsx`

## Résumé des fichiers à modifier
- `src/app/api/posts/[id]/like/route.ts` — ajouter notification sur like
- `src/app/api/posts/[id]/comments/route.ts` — ajouter notification sur comment/reply
- `src/app/api/messages/[conversationId]/route.ts` — ajouter notification sur message
- `src/components/layout/Header.tsx` — ajouter NotificationBellWrapper
- `src/messages/en.json` — section notifications
- `src/messages/fr.json` — section notifications
- `src/messages/es.json` — section notifications
