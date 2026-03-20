"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface NotificationActor {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface Notification {
  id: string;
  type: "like" | "comment" | "reply" | "message" | "follow";
  post_id: string | null;
  comment_id: string | null;
  conversation_id: string | null;
  read: boolean;
  created_at: string;
  actor: NotificationActor | null;
  post_preview: string | null;
}

type FilterType = "all" | "unread" | "like" | "comment" | "message";

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function NotificationsPageClient() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [offset, setOffset] = useState(0);

  const fetchNotifications = useCallback(async (newOffset = 0, append = false) => {
    try {
      const res = await fetch(`/api/notifications?limit=20&offset=${newOffset}`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setNotifications(prev => [...prev, ...(data.notifications || [])]);
        } else {
          setNotifications(data.notifications || []);
        }
        setUnreadCount(data.unread_count || 0);
        setHasMore(data.has_more || false);
        setOffset(newOffset + (data.notifications?.length || 0));
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const loadMore = () => {
    setLoadingMore(true);
    fetchNotifications(offset, true);
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // fail silently
    }
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.read) {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [notif.id] }),
        });
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {
        // fail silently
      }
    }

    if (notif.type === "message" && notif.conversation_id) {
      router.push(`/messages/${notif.conversation_id}`);
    } else if (notif.post_id) {
      router.push("/feed");
    }
  };

  const getNotifText = (notif: Notification): string => {
    const name = notif.actor?.display_name || notif.actor?.username || t("someone");
    switch (notif.type) {
      case "like": return t("likedYourPost", { name });
      case "comment": return t("commentedOnYourPost", { name });
      case "reply": return t("repliedToYourComment", { name });
      case "message": return t("sentYouAMessage", { name });
      case "follow": return t("startedFollowingYou", { name });
      default: return t("newNotification");
    }
  };

  // Client-side filtering
  const filtered = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    if (filter === "like") return n.type === "like";
    if (filter === "comment") return n.type === "comment" || n.type === "reply";
    if (filter === "message") return n.type === "message";
    return true;
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "unread", label: t("filterUnread") },
    { key: "like", label: t("filterLikes") },
    { key: "comment", label: t("filterComments") },
    { key: "message", label: t("filterMessages") },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-700">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            {t("markAllAsRead")}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card dark:border-gray-700 dark:bg-gray-900">
          {filtered.map((notif, index) => {
            const actor = notif.actor;
            const initial = (actor?.display_name || actor?.username || "?").charAt(0).toUpperCase();

            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                  !notif.read ? "bg-primary-50/50" : ""
                } ${index > 0 ? "border-t border-gray-100" : ""}`}
              >
                {actor?.avatar_url ? (
                  <img src={actor.avatar_url} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-bold text-white">
                    {initial}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">{getNotifText(notif)}</p>
                  {notif.post_preview && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">{notif.post_preview}</p>
                  )}
                  <p className="mt-1 text-[10px] text-gray-400">{timeAgo(notif.created_at)}</p>
                </div>
                {!notif.read && (
                  <span className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary-600" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-card">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          <p className="mt-4 text-sm font-medium text-gray-900">{t("empty")}</p>
          <p className="mt-1 text-sm text-gray-500">{t("emptyDescription")}</p>
        </div>
      )}

      {/* Load more */}
      {hasMore && filter === "all" && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingMore ? "..." : t("loadMore")}
          </button>
        </div>
      )}
    </div>
  );
}
