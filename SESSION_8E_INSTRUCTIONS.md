# SESSION 8E — Fix post creation, translation, and hardcoded English strings

## PROBLÈME 1 : Création de post échoue ("Internal server error")

Le fichier `src/app/api/posts/route.ts` utilise le client Supabase normal (avec RLS) pour l'INSERT dans la table `posts`. Si la politique RLS ne permet pas l'insertion, ça échoue silencieusement. On doit utiliser le service client (qui bypass RLS) après avoir vérifié l'auth.

### Étape 1 : Modifier `src/app/api/posts/route.ts`

Remplacer TOUT le contenu du fichier par :

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// POST /api/posts — Créer un nouveau post
export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'auth avec le client normal
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, content, prompt_content, link_url, locale, image_urls } = body;

    if (!content || !category) {
      return NextResponse.json({ error: 'Content and category are required' }, { status: 400 });
    }

    // 2. Utiliser le service client pour bypasser RLS
    const serviceClient = createServiceClient();

    // Trouver l'ID de l'utilisateur dans notre table users
    const { data: userData } = await serviceClient
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    let authorId = userData?.id;

    if (!authorId) {
      // Fallback: chercher par email
      const { data: userByEmail } = await serviceClient
        .from('users')
        .select('id')
        .eq('email', user.email!)
        .single();

      if (!userByEmail) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }
      authorId = userByEmail.id;
    }

    // 3. Insérer le post avec le service client
    const { data: post, error } = await serviceClient
      .from('posts')
      .insert({
        author_id: authorId,
        category,
        content,
        prompt_content: prompt_content || null,
        link_url: link_url || null,
        locale: locale || 'en',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json({ error: `Failed to create post: ${error.message}` }, { status: 500 });
    }

    // 4. Insérer les images si présentes (non-bloquant si erreur)
    if (image_urls && Array.isArray(image_urls) && image_urls.length > 0 && post) {
      try {
        const imageInserts = image_urls.map((url: string, index: number) => ({
          post_id: post.id,
          image_url: url,
          position: index,
        }));
        const { error: imgError } = await serviceClient.from('post_images').insert(imageInserts);
        if (imgError) {
          console.error('Error inserting post images:', imgError);
        }
      } catch (imgErr) {
        console.error('Error inserting post images:', imgErr);
      }
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## PROBLÈME 2 : Traduction ne fonctionne pas

La route `/api/translate` utilise l'API Anthropic. L'erreur est probablement que la variable d'environnement `ANTHROPIC_API_KEY` n'est pas définie dans Vercel, ou que la clé n'a plus de crédits.

### Étape 2 : Améliorer le logging de `src/app/api/translate/route.ts`

Remplacer TOUT le contenu par :

```typescript
import { NextRequest, NextResponse } from 'next/server';

const langNames: Record<string, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
};

// POST /api/translate — Traduire du texte via Claude
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json({ error: 'Translation service not configured' }, { status: 503 });
    }

    const { text, from, to } = await request.json();

    if (!text || !from || !to) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (from === to) {
      return NextResponse.json({ translated: text });
    }

    // Limiter à 1000 caractères
    const trimmedText = text.slice(0, 1000);
    const fromLang = langNames[from] || from;
    const toLang = langNames[to] || to;

    // Appel direct à l'API Anthropic (sans SDK pour éviter les problèmes d'import)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Translate the following text from ${fromLang} to ${toLang}. Return ONLY the translation, nothing else. Do not add quotes or explanations.\n\nText to translate:\n${trimmedText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Anthropic API error:', response.status, errorBody);

      if (response.status === 401) {
        return NextResponse.json({ error: 'Translation service unavailable (invalid API key)' }, { status: 503 });
      }
      if (response.status === 429) {
        return NextResponse.json({ error: 'Too many translation requests' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }

    const data = await response.json();
    const translated = data.content?.[0]?.type === 'text' ? data.content[0].text : '';

    if (!translated) {
      return NextResponse.json({ error: 'Translation returned empty result' }, { status: 500 });
    }

    return NextResponse.json({ translated: translated.trim() });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Translation error:', errMsg);
    return NextResponse.json({ error: `Translation failed: ${errMsg}` }, { status: 500 });
  }
}
```

> **IMPORTANT** : Benjamin doit vérifier dans Vercel > Settings > Environment Variables que `ANTHROPIC_API_KEY` est bien défini avec une clé API valide qui a des crédits. Si la clé n'existe pas, la traduction ne marchera jamais.

---

## PROBLÈME 3 : Textes en anglais non traduits

Plusieurs composants ont des textes hardcodés en anglais au lieu d'utiliser les traductions i18n.

### Étape 3A : Ajouter des clés manquantes aux fichiers de traduction

#### `src/messages/en.json` — Ajouter dans "common" :

Trouver :
```json
    "language": "Language"
```

Remplacer par :
```json
    "language": "Language",
    "cancel": "Cancel"
```

Trouver :
```json
  "messages": {
    "title": "Messages",
    "noMessages": "No messages yet",
    "noMessagesDesc": "Start a conversation by visiting someone's profile and clicking \"Message\".",
    "typeMessage": "Type a message...",
    "send": "Send"
  }
```

Remplacer par :
```json
  "messages": {
    "title": "Messages",
    "noMessages": "No messages yet",
    "noMessagesDesc": "Start a conversation by visiting someone's profile and clicking \"Message\".",
    "typeMessage": "Type a message...",
    "send": "Send",
    "backToMessages": "Back",
    "unknown": "Unknown"
  }
```

Aussi ajouter dans "profile", trouver :
```json
    "likesReceived": "Likes received"
```

Remplacer par :
```json
    "likesReceived": "Likes received",
    "deleteConfirmPlaceholder": "DELETE",
    "cancelAction": "Cancel",
    "deleteFailed": "Failed to delete account"
```

#### `src/messages/fr.json` — Mêmes ajouts :

Trouver :
```json
    "language": "Langue"
```

Remplacer par :
```json
    "language": "Langue",
    "cancel": "Annuler"
```

Trouver :
```json
  "messages": {
    "title": "Messages",
    "noMessages": "Aucun message pour le moment",
    "noMessagesDesc": "Commencez une conversation en visitant le profil de quelqu'un et en cliquant sur \"Message\".",
    "typeMessage": "Écrivez un message...",
    "send": "Envoyer"
  }
```

Remplacer par :
```json
  "messages": {
    "title": "Messages",
    "noMessages": "Aucun message pour le moment",
    "noMessagesDesc": "Commencez une conversation en visitant le profil de quelqu'un et en cliquant sur \"Message\".",
    "typeMessage": "Écrivez un message...",
    "send": "Envoyer",
    "backToMessages": "Retour",
    "unknown": "Inconnu"
  }
```

Aussi dans "profile", trouver :
```json
    "likesReceived": "Likes reçus"
```

Remplacer par :
```json
    "likesReceived": "Likes reçus",
    "deleteConfirmPlaceholder": "SUPPRIMER",
    "cancelAction": "Annuler",
    "deleteFailed": "Échec de la suppression du compte"
```

#### `src/messages/es.json` — Mêmes ajouts :

Trouver :
```json
    "language": "Idioma"
```

Remplacer par :
```json
    "language": "Idioma",
    "cancel": "Cancelar"
```

Trouver :
```json
  "messages": {
    "title": "Mensajes",
    "noMessages": "Sin mensajes todavía",
    "noMessagesDesc": "Inicia una conversación visitando el perfil de alguien y haciendo clic en \"Mensaje\".",
    "typeMessage": "Escribe un mensaje...",
    "send": "Enviar"
  }
```

Remplacer par :
```json
  "messages": {
    "title": "Mensajes",
    "noMessages": "Sin mensajes todavía",
    "noMessagesDesc": "Inicia una conversación visitando el perfil de alguien y haciendo clic en \"Mensaje\".",
    "typeMessage": "Escribe un mensaje...",
    "send": "Enviar",
    "backToMessages": "Volver",
    "unknown": "Desconocido"
  }
```

Aussi dans "profile", trouver :
```json
    "likesReceived": "Likes recibidos"
```

Remplacer par :
```json
    "likesReceived": "Likes recibidos",
    "deleteConfirmPlaceholder": "ELIMINAR",
    "cancelAction": "Cancelar",
    "deleteFailed": "Error al eliminar la cuenta"
```

---

### Étape 3B : Corriger `src/app/[locale]/messages/page.tsx`

Ce fichier est un client component mais n'utilise PAS les traductions. Il faut ajouter `useTranslations`.

Remplacer TOUT le contenu par :

```tsx
"use client";

import { useEffect, useState } from "react";
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
  const t = useTranslations("messages");
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
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
      </div>

      {conversations.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {conversations.map((conv, index) => {
            const name = conv.otherUser?.display_name || conv.otherUser?.username || t("unknown");
            const avatar = conv.otherUser?.avatar_url;
            const initial = name.charAt(0).toUpperCase();
            const preview = conv.lastMessage?.content
              ? conv.lastMessage.content.slice(0, 60) + (conv.lastMessage.content.length > 60 ? "..." : "")
              : t("noMessages");

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
          <p className="mt-4 text-sm font-medium text-gray-900">{t("noMessages")}</p>
          <p className="mt-1 text-sm text-gray-500">{t("noMessagesDesc")}</p>
        </div>
      )}
    </div>
  );
}
```

---

### Étape 3C : Corriger `src/app/[locale]/messages/[conversationId]/page.tsx`

Remplacer TOUT le contenu par :

```tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("messages");
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

  const otherUser = messages.find(m => m.sender_id !== myUserId)?.sender;
  const otherName = otherUser?.display_name || otherUser?.username || t("unknown");

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
                      : "border border-gray-200 bg-white text-gray-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
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
            placeholder={t("typeMessage")}
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

### Étape 3D : Corriger les textes hardcodés dans `src/components/feed/PostCard.tsx`

Dans ce fichier, chercher la ligne :
```
                Cancel
```
(ligne 244, dans le bouton d'annulation de suppression)

Remplacer par :
```
                {t("post.cancel") || "Cancel"}
```

AUSSI, ajouter la clé `"cancel"` dans les fichiers de traduction sous `feed.post` :

Dans `src/messages/en.json`, trouver dans feed.post :
```json
      "translate": "Translate to {lang}"
```
Remplacer par :
```json
      "translate": "Translate to {lang}",
      "cancel": "Cancel"
```

Dans `src/messages/fr.json`, trouver dans feed.post :
```json
      "translate": "Traduire en {lang}"
```
Remplacer par :
```json
      "translate": "Traduire en {lang}",
      "cancel": "Annuler"
```

Dans `src/messages/es.json`, trouver dans feed.post :
```json
      "translate": "Traducir a {lang}"
```
Remplacer par :
```json
      "translate": "Traducir a {lang}",
      "cancel": "Cancelar"
```

---

### Étape 3E : Corriger les textes hardcodés dans `src/app/[locale]/profile/page.tsx`

1. Chercher `Cancel` (le bouton d'annulation dans la zone de suppression, vers la fin du fichier) :
```
                Cancel
```
Remplacer par :
```
                {t("cancelAction")}
```

2. Chercher `placeholder="DELETE"` :
```
              placeholder="DELETE"
```
Remplacer par :
```
              placeholder={t("deleteConfirmPlaceholder")}
```

3. Chercher les deux occurrences de `'Failed to delete account'` :
```
        setMessage({ type: 'error', text: data.error || 'Failed to delete account' });
```
Remplacer par :
```
        setMessage({ type: 'error', text: data.error || t("deleteFailed") });
```

Et aussi :
```
      setMessage({ type: 'error', text: 'Failed to delete account' });
```
Remplacer par :
```
      setMessage({ type: 'error', text: t("deleteFailed") });
```

4. Chercher la condition de confirmation `deleteConfirmText !== "DELETE"` :
```
                disabled={deleteConfirmText !== "DELETE" || deleting}
```
NOTE : Cette condition doit rester "DELETE" en anglais car c'est la chaîne que l'utilisateur doit taper. On pourrait la localiser mais c'est plus complexe. Laissons tel quel pour l'instant, mais le placeholder aidera l'utilisateur à comprendre.

Hmm en fait, pour bien faire, changeons la vérification pour accepter la version traduite aussi :
```
                disabled={(deleteConfirmText !== "DELETE" && deleteConfirmText !== "SUPPRIMER" && deleteConfirmText !== "ELIMINAR") || deleting}
```

---

### Étape 3F : Corriger `src/components/feed/CommentSection.tsx`

Chercher la ligne "Loading..." hardcodée (vers ligne 130) :
```
            <div className="p-4 text-center text-xs text-gray-400">Loading...</div>
```
Remplacer par :
```
            <div className="p-4 text-center text-xs text-gray-400">{t("comments.loading") || "..."}</div>
```

Ajouter aussi la clé dans les fichiers de traduction. Dans `src/messages/en.json`, dans `feed.comments` :
Trouver :
```json
      "loginToComment": "Log in to comment"
```
Remplacer par :
```json
      "loginToComment": "Log in to comment",
      "loading": "Loading..."
```

Dans `src/messages/fr.json`, dans `feed.comments` :
Trouver :
```json
      "loginToComment": "Connectez-vous pour commenter"
```
Remplacer par :
```json
      "loginToComment": "Connectez-vous pour commenter",
      "loading": "Chargement..."
```

Dans `src/messages/es.json`, dans `feed.comments` :
Trouver :
```json
      "loginToComment": "Inicia sesión para comentar"
```
Remplacer par :
```json
      "loginToComment": "Inicia sesión para comentar",
      "loading": "Cargando..."
```

---

## Étape 4 : Build, test, commit, push

```bash
cd C:\Users\Smartlabz\OneDrive\Documents\synapse
npm run build
```

Si le build réussit :

```bash
git add -A
git commit -m "Fix post creation (use service client), improve translation error handling, fix hardcoded English strings across messaging and profile pages"
git push
```

> **RAPPEL** : Benjamin doit vérifier que `ANTHROPIC_API_KEY` est bien défini dans Vercel > Settings > Environment Variables avec une clé API Anthropic valide. Sans ça, la traduction ne marchera jamais.
