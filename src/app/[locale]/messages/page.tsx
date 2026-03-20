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
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
      </div>

      {conversations.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
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
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{name}</span>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-400">{timeAgo(conv.lastMessage.created_at)}</span>
                    )}
                  </div>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">{preview}</p>
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
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
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
