# SESSION 8D — Fix bugs critiques + Stats profil + Messagerie privée

## CONTEXTE
Trois catégories de travail :
1. Fix bugs : upload d'images ne fonctionne pas, traduction cassée, textes en anglais
2. Stats sur le profil
3. Messagerie privée entre utilisateurs

**IMPORTANT** : Fais les étapes UNE PAR UNE, dans l'ordre. Attends ma confirmation entre chaque étape.

---

## ÉTAPE 1 : Fix du PostComposer — afficher les erreurs

Le problème principal : quand l'upload ou la création du post échoue, AUCUNE erreur n'est affichée à l'utilisateur. Le formulaire reste rempli sans feedback.

### Modifier `src/components/feed/PostComposer.tsx`

Dans la fonction `handleSubmit`, remplacer le bloc après `const res = await fetch("/api/posts", ...)` :

**REMPLACER** (lignes ~111-120) :
```typescript
      if (res.ok) {
        setContent("");
        setPromptContent("");
        setLinkUrl("");
        setShowPromptField(false);
        setShowLinkField(false);
        setImages([]);
        setImagePreviews([]);
        router.refresh();
      }
```

**PAR** :
```typescript
      if (res.ok) {
        setContent("");
        setPromptContent("");
        setLinkUrl("");
        setShowPromptField(false);
        setShowLinkField(false);
        setImages([]);
        setImagePreviews([]);
        router.refresh();
      } else {
        // Afficher l'erreur renvoyée par l'API
        try {
          const data = await res.json();
          setError(data.error || `Publication failed (status ${res.status})`);
        } catch {
          setError(`Publication failed (status ${res.status})`);
        }
      }
```

Aussi, dans le bloc d'upload des images (lignes ~78-86), ajouter un meilleur logging des erreurs :

**REMPLACER** :
```typescript
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            return data.url;
          }
          return null;
```

**PAR** :
```typescript
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            return data.url;
          } else {
            try {
              const errData = await res.json();
              console.error('Upload failed:', errData.error);
            } catch {
              console.error('Upload failed with status:', res.status);
            }
            return null;
          }
```

---

## ÉTAPE 2 : Fix de l'API upload — body size limit Vercel

Vercel Hobby plan a une limite de 4.5 MB pour le body des API routes. Notre limite est 5 MB dans le code mais Vercel coupe avant.

### Modifier `src/app/api/upload/route.ts`

1. Réduire la limite à 4 MB pour être safe :

Remplacer :
```typescript
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }
```

Par :
```typescript
    // Vercel Hobby plan limite le body à 4.5MB — on limite à 4MB pour être safe
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 400 });
    }
```

2. Ajouter le runtime Node.js explicitement en haut du fichier (après les imports) :
```typescript
export const runtime = 'nodejs';
```

3. Ajouter un log de succès pour le debug :
```typescript
    console.log(`Image uploaded successfully: ${fileName} (${file.size} bytes)`);
```
(juste avant le `return NextResponse.json({ url: publicUrl })`)

---

## ÉTAPE 3 : Fix de la traduction des posts

La traduction utilise l'API Anthropic. Si elle ne fonctionne plus, c'est probablement un problème de clé API ou de crédits.

### Modifier `src/app/api/translate/route.ts`

Ajouter un meilleur logging et un fallback :

Remplacer tout le catch block :
```typescript
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
```

Par :
```typescript
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Translation error:', errMsg);

    // Si l'API key est invalide ou pas de crédits, renvoyer un message clair
    if (errMsg.includes('401') || errMsg.includes('authentication') || errMsg.includes('invalid')) {
      return NextResponse.json({ error: 'Translation service unavailable (API key issue)' }, { status: 503 });
    }
    if (errMsg.includes('429') || errMsg.includes('rate')) {
      return NextResponse.json({ error: 'Too many translation requests, try again later' }, { status: 429 });
    }

    return NextResponse.json({ error: `Translation failed: ${errMsg}` }, { status: 500 });
  }
```

Aussi, dans le PostCard, quand la traduction échoue, afficher un message à l'utilisateur au lieu de fail silently.

### Modifier `src/components/feed/PostCard.tsx`

Ajouter un état pour l'erreur de traduction :
```typescript
const [translateError, setTranslateError] = useState<string | null>(null);
```

Dans `handleTranslate`, remplacer le catch :
```typescript
    } catch {
      setTranslateError('Translation unavailable');
      setTimeout(() => setTranslateError(null), 3000);
    }
```

Et ajouter un feedback aussi quand `res` n'est pas ok :
```typescript
      if (res.ok) {
        const data = await res.json();
        setTranslatedText(data.translated);
      } else {
        setTranslateError('Translation unavailable');
        setTimeout(() => setTranslateError(null), 3000);
      }
```

Afficher le message d'erreur dans le JSX, juste après le bouton de traduction :
```tsx
{translateError && (
  <span className="ml-2 text-xs text-red-500">{translateError}</span>
)}
```

---

## ÉTAPE 4 : Fix des textes hardcodés en anglais

La page profil et la page bookmarks ont des textes en anglais hardcodés. Il faut utiliser les clés i18n.

### Modifier `src/app/[locale]/profile/page.tsx`

Remplacer TOUS les textes hardcodés dans la section Preferences :

1. `<h2 className="text-lg font-semibold text-gray-900">Preferences</h2>`
→ `<h2 className="text-lg font-semibold text-gray-900">{t("preferences")}</h2>`

2. `<label className="mb-1 block text-sm font-medium">Default post language</label>`
→ `<label className="mb-1 block text-sm font-medium">{t("defaultPostLanguage")}</label>`

3. `<p className="mt-1 text-xs text-gray-500">Language used by default when creating new posts</p>`
→ `<p className="mt-1 text-xs text-gray-500">{t("defaultPostLanguageDesc")}</p>`

4. `<p className="text-sm font-medium">Public profile</p>`
→ `<p className="text-sm font-medium">{t("publicProfile")}</p>`

5. `<p className="text-xs text-gray-500">Allow others to see your profile when they click your name</p>`
→ `<p className="text-xs text-gray-500">{t("publicProfileDesc")}</p>`

6. `<p className="text-sm font-medium">Email notifications</p>`
→ `<p className="text-sm font-medium">{t("emailNotifications")}</p>`

7. `<p className="text-xs text-gray-500">Get notified about replies and likes (coming soon)</p>`
→ `<p className="text-xs text-gray-500">{t("emailNotificationsDesc")}</p>`

8. Le bouton `"Save preferences"` :
→ `{saving ? t("saving") : t("savePreferences")}`

9. Le bouton "Cancel" dans la Danger Zone :
→ Laisser "Cancel" car c'est un terme universel, ou ajouter une clé `"cancel"` dans common.

### Modifier `src/app/[locale]/bookmarks/page.tsx`

Utiliser les traductions `t("profile.savedPosts")` etc. au lieu des textes hardcodés. Ajouter les imports nécessaires pour `getTranslations`.

### Modifier `src/components/auth/AuthButton.tsx`

Remplacer `Saved Posts` hardcodé par une traduction. Ajouter une clé dans le namespace `auth` : `"savedPosts": "Saved Posts"` (en), `"savedPosts": "Posts sauvegardés"` (fr), `"savedPosts": "Posts guardados"` (es).

### Modifier `src/app/[locale]/user/[username]/page.tsx`

Remplacer les textes hardcodés :
- "Back to feed" → traduction
- "Posts" → traduction
- "Member since" → traduction
- "No posts yet." → traduction

---

## ÉTAPE 5 : Statistiques sur le profil

Ajouter une section "Stats" visible sur la page profil et sur les profils publics.

### Créer une query `getUserStats` dans `src/lib/queries/users.ts`

```typescript
export async function getUserStats(userId: string) {
  const supabase = await createClient();

  const [postsResult, commentsResult, likesReceivedResult] = await Promise.all([
    // Nombre de posts
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId),
    // Nombre de commentaires
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', userId),
    // Total des likes reçus sur ses posts
    supabase.from('posts').select('likes_count').eq('author_id', userId),
  ]);

  const postsCount = postsResult.count || 0;
  const commentsCount = commentsResult.count || 0;
  const likesReceived = (likesReceivedResult.data || []).reduce(
    (sum, post) => sum + ((post as { likes_count: number }).likes_count || 0), 0
  );

  return { postsCount, commentsCount, likesReceived };
}
```

### Ajouter la section stats sur la page profil

Dans `src/app/[locale]/profile/page.tsx`, après l'avatar et avant le formulaire, ajouter un composant de stats. Puisque c'est un client component, on va fetch les stats via une API route.

**Créer l'API route** `src/app/api/account/stats/route.ts` :
```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Trouver l'user interne
    const { data: userData } = await serviceClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ postsCount: 0, commentsCount: 0, likesReceived: 0 });
    }

    const [postsResult, commentsResult, likesResult] = await Promise.all([
      serviceClient.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userData.id),
      serviceClient.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', userData.id),
      serviceClient.from('posts').select('likes_count').eq('author_id', userData.id),
    ]);

    const likesReceived = (likesResult.data || []).reduce(
      (sum: number, post: Record<string, number>) => sum + (post.likes_count || 0), 0
    );

    return NextResponse.json({
      postsCount: postsResult.count || 0,
      commentsCount: commentsResult.count || 0,
      likesReceived,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ postsCount: 0, commentsCount: 0, likesReceived: 0 });
  }
}
```

**Dans la page profil**, ajouter un useEffect pour charger les stats et les afficher :
```typescript
const [stats, setStats] = useState({ postsCount: 0, commentsCount: 0, likesReceived: 0 });

useEffect(() => {
  fetch('/api/account/stats').then(res => res.json()).then(setStats).catch(() => {});
}, []);
```

**JSX** (après la section avatar, avant les messages) :
```tsx
{/* Stats */}
<div className="mb-8 grid grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
  <div className="text-center">
    <p className="text-2xl font-bold text-gray-900">{stats.postsCount}</p>
    <p className="text-xs text-gray-500">Posts</p>
  </div>
  <div className="text-center">
    <p className="text-2xl font-bold text-gray-900">{stats.commentsCount}</p>
    <p className="text-xs text-gray-500">Comments</p>
  </div>
  <div className="text-center">
    <p className="text-2xl font-bold text-red-500">{stats.likesReceived}</p>
    <p className="text-xs text-gray-500">Likes received</p>
  </div>
</div>
```

(Utiliser les clés i18n : ajouter `"postsCount": "Posts"`, `"commentsCount": "Comments"`, `"likesReceived": "Likes received"` dans les 3 fichiers de messages)

---

## ÉTAPE 6 : Messagerie privée — Migration SQL

**⚠️ CRÉER le fichier `supabase/migrations/014_private_messages.sql` (Claude Code crée le fichier, Benjamin exécute le SQL dans Supabase)** :

```sql
-- Migration 014: Private messaging
-- Tables: conversations, conversation_participants, messages

-- 1. Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Participants d'une conversation
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_cp_user_id ON conversation_participants(user_id);
CREATE INDEX idx_cp_conversation_id ON conversation_participants(conversation_id);

-- 3. Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);

-- Trigger updated_at sur conversations (quand un message est envoyé)
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conversation_updated
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations : visible si on est participant
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
    )
  );

-- Participants : visible si on est dans la conversation
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
    )
  );

-- Messages : visible si on est participant de la conversation
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()::text)
    )
  );

-- Grants
GRANT SELECT ON conversations, conversation_participants, messages TO authenticated;
GRANT INSERT ON conversations, conversation_participants, messages TO authenticated;
GRANT UPDATE ON conversation_participants TO authenticated;
GRANT ALL ON conversations, conversation_participants, messages TO service_role;
```

---

## ÉTAPE 7 : Messagerie privée — API routes

### 7a. Créer `src/app/api/messages/conversations/route.ts`

**GET** — Liste des conversations de l'utilisateur connecté
**POST** — Créer une nouvelle conversation (ou retourner l'existante) avec un autre utilisateur

```typescript
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
```

### 7b. Créer `src/app/api/messages/[conversationId]/route.ts`

**GET** — Messages d'une conversation
**POST** — Envoyer un message

```typescript
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
```

---

## ÉTAPE 8 : Page Messages `/messages`

### Créer `src/app/[locale]/messages/page.tsx`

Page qui affiche la liste des conversations. Design style messagerie : liste à gauche, pas encore de vue chat (ça sera au clic → redirect vers la conversation).

C'est un **client component** car elle fetch les conversations dynamiquement.

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  lastMessage: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unreadCount: number;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/messages/conversations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setConversations(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
      </div>

      {conversations.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {conversations.map((conv, index) => {
            const name = conv.otherUser?.display_name || conv.otherUser?.username || "Unknown";
            const avatar = conv.otherUser?.avatar_url;
            const initial = name.charAt(0).toUpperCase();
            const preview = conv.lastMessage?.content
              ? conv.lastMessage.content.slice(0, 60) + (conv.lastMessage.content.length > 60 ? "..." : "")
              : "No messages yet";

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={`flex items-center gap-3 p-4 transition-colors hover:bg-gray-50 ${
                  index > 0 ? "border-t border-gray-100" : ""
                }`}
              >
                {avatar ? (
                  <img src={avatar} alt={name} className="h-12 w-12 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white">
                    {initial}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{name}</span>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-400">{timeAgo(conv.lastMessage.created_at)}</span>
                    )}
                  </div>
                  <p className="truncate text-sm text-gray-500">{preview}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-bold text-white">
                    {conv.unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          <p className="mt-4 text-sm font-medium text-gray-900">No messages yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Start a conversation by visiting someone&apos;s profile and clicking &quot;Message&quot;.
          </p>
        </div>
      )}
    </div>
  );
}
```

### Créer `src/app/[locale]/messages/[conversationId]/page.tsx`

Page de chat — vue des messages avec champ de saisie en bas.

```typescript
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [myUserId, setMyUserId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setMyUserId(data.myUserId || "");
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // Polling toutes les 5 secondes pour les nouveaux messages
    pollRef.current = setInterval(loadMessages, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);

    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage("");
      }
    } catch {
      // fail silently
    } finally {
      setSending(false);
    }
  };

  // Trouver le nom de l'autre participant
  const otherUser = messages.find(m => m.sender_id !== myUserId)?.sender;
  const otherName = otherUser?.display_name || otherUser?.username || "User";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/messages" className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        {otherUser?.avatar_url ? (
          <img src={otherUser.avatar_url} alt={otherName} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
            {otherName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-semibold text-gray-900">{otherName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        <div className="space-y-3">
          {messages.map((msg) => {
            const isMine = msg.sender_id === myUserId;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMine
                      ? "bg-primary-600 text-white"
                      : "bg-white text-gray-900 border border-gray-200"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`mt-1 text-[10px] ${isMine ? "text-primary-200" : "text-gray-400"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="rounded-full bg-primary-600 p-2 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## ÉTAPE 9 : Bouton "Message" sur les profils publics

### Modifier `src/app/[locale]/user/[username]/page.tsx`

Ajouter un bouton "Message" dans le header du profil. Au clic, il crée/trouve une conversation et redirige vers `/messages/[conversationId]`.

Transformer ce composant en client component OU créer un sous-composant client `MessageButton` :

**Créer `src/components/feed/MessageButton.tsx`** :

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MessageButton({ targetUserId }: { targetUserId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/messages/${data.conversationId}`);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
      {loading ? "..." : "Message"}
    </button>
  );
}
```

Puis dans `user/[username]/page.tsx`, l'importer et l'ajouter dans le profil header, après la bio :
```tsx
{viewer && viewerId !== user.id && (
  <MessageButton targetUserId={user.id} />
)}
```

---

## ÉTAPE 10 : Lien "Messages" dans le menu et la navigation

### Dans `src/components/auth/AuthButton.tsx`

Ajouter un lien "Messages" dans le dropdown, entre "Saved Posts" et "Logout" :
```tsx
<Link
  href="/messages"
  onClick={() => setMenuOpen(false)}
  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
>
  Messages
</Link>
```

### Dans le middleware

Ajouter `/messages` aux routes protégées :
```typescript
const protectedPaths = ["/profile", "/bookmarks", "/messages"];
```

---

## ÉTAPE 11 : Traductions pour les messages

**en.json** — ajouter un namespace `"messages"` :
```json
"messages": {
  "title": "Messages",
  "noMessages": "No messages yet",
  "noMessagesDesc": "Start a conversation by visiting someone's profile and clicking \"Message\".",
  "typeMessage": "Type a message...",
  "send": "Send"
}
```

**fr.json** :
```json
"messages": {
  "title": "Messages",
  "noMessages": "Aucun message pour le moment",
  "noMessagesDesc": "Commencez une conversation en visitant le profil de quelqu'un et en cliquant sur \"Message\".",
  "typeMessage": "Écrivez un message...",
  "send": "Envoyer"
}
```

**es.json** :
```json
"messages": {
  "title": "Mensajes",
  "noMessages": "Sin mensajes todavía",
  "noMessagesDesc": "Inicia una conversación visitando el perfil de alguien y haciendo clic en \"Mensaje\".",
  "typeMessage": "Escribe un mensaje...",
  "send": "Enviar"
}
```

Aussi ajouter dans `"auth"` : `"messages": "Messages"` (en), `"messages": "Messages"` (fr), `"messages": "Mensajes"` (es).

---

## ÉTAPE 12 : Build + Test + Commit

1. `npm run build`
2. Tester :
   - Créer un post avec une image → vérifier que l'erreur est affichée si ça échoue
   - Cliquer "Traduire" sur un post → vérifier le feedback d'erreur
   - Page profil en français → tous les textes doivent être en français
   - Stats visibles sur le profil
   - Page `/messages` accessible
   - Cliquer "Message" sur un profil public → créer une conversation
3. Commiter :
```bash
git add -A
git commit -m "Fix upload/translation errors, add profile stats and private messaging"
git push
```

---

## ⚠️ APRÈS LE COMMIT — SQL À EXÉCUTER PAR BENJAMIN

Dans le SQL Editor de Supabase, exécuter le contenu de `supabase/migrations/014_private_messages.sql`.

---

## RÉSUMÉ DES FICHIERS

| Action | Fichier |
|--------|---------|
| MODIFIER | `src/components/feed/PostComposer.tsx` (afficher erreurs) |
| MODIFIER | `src/app/api/upload/route.ts` (runtime + taille + logs) |
| MODIFIER | `src/app/api/translate/route.ts` (meilleur error handling) |
| MODIFIER | `src/components/feed/PostCard.tsx` (erreur traduction) |
| MODIFIER | `src/app/[locale]/profile/page.tsx` (textes i18n + stats) |
| MODIFIER | `src/app/[locale]/bookmarks/page.tsx` (textes i18n) |
| MODIFIER | `src/app/[locale]/user/[username]/page.tsx` (textes i18n + bouton Message) |
| MODIFIER | `src/components/auth/AuthButton.tsx` (lien Messages) |
| MODIFIER | `middleware.ts` (protéger /messages) |
| CRÉER | `src/app/api/account/stats/route.ts` |
| CRÉER | `src/app/api/messages/conversations/route.ts` |
| CRÉER | `src/app/api/messages/[conversationId]/route.ts` |
| CRÉER | `src/app/[locale]/messages/page.tsx` |
| CRÉER | `src/app/[locale]/messages/[conversationId]/page.tsx` |
| CRÉER | `src/components/feed/MessageButton.tsx` |
| CRÉER | `supabase/migrations/014_private_messages.sql` |
| MODIFIER | `src/messages/en.json`, `fr.json`, `es.json` |
