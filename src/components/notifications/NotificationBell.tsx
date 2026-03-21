"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";

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

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function NotificationBell() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {
      // fail silently
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (notif: Notification) => {
    // Mark as read
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

    setIsOpen(false);

    // Navigate
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-400"
        aria-label={t("notifications")}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 animate-fade-in rounded-xl border border-gray-200 bg-white shadow-card sm:w-96 dark:border-gray-700 dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{t("notifications")}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 disabled:opacity-50"
              >
                {t("markAllAsRead")}
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => {
                const actor = notif.actor;
                const initial = (actor?.display_name || actor?.username || "?").charAt(0).toUpperCase();

                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      !notif.read ? "bg-primary-50/50 dark:bg-primary-900/20" : ""
                    }`}
                  >
                    {/* Avatar */}
                    {actor?.avatar_url ? (
                      <img src={actor.avatar_url} alt="" className="h-9 w-9 flex-shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-bold text-white">
                        {initial}
                      </div>
                    )}

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{getNotifText(notif)}</p>
                      {notif.post_preview && (
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{notif.post_preview}</p>
                      )}
                      <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">{timeAgo(notif.created_at)}</p>
                    </div>

                    {/* Unread dot */}
                    {!notif.read && (
                      <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary-600" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <svg className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t("noNotifications")}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-2 dark:border-gray-700">
            <button
              onClick={() => { setIsOpen(false); router.push("/notifications"); }}
              className="block w-full rounded-lg px-3 py-2 text-center text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:hover:bg-gray-800"
            >
              {t("viewAll")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
