"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  author?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function CommentSection({
  postId,
  isLoggedIn,
  initialCount,
}: {
  postId: string;
  isLoggedIn: boolean;
  initialCount: number;
}) {
  const t = useTranslations("feed");
  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (isOpen && comments.length === 0) {
      loadComments();
    }
  }, [isOpen]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
        setCount((c) => c + 1);
      }
    } catch {
      // fail silently
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
        </svg>
        <span>{count > 0 ? count : ""}</span>
      </button>

      {/* Comments panel */}
      {isOpen && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50">
          {/* Comment input */}
          {isLoggedIn ? (
            <div className="flex gap-2 border-b border-gray-200 p-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={t("comments.placeholder")}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
                className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? "..." : t("comments.reply")}
              </button>
            </div>
          ) : (
            <div className="border-b border-gray-200 p-3 text-center text-xs text-gray-500">
              {t("comments.loginToComment")}
            </div>
          )}

          {/* Comments list */}
          {loading ? (
            <div className="p-4 text-center text-xs text-gray-400">{t("comments.loading") || "..."}</div>
          ) : comments.length > 0 ? (
            <div className="max-h-64 divide-y divide-gray-200 overflow-y-auto">
              {comments.map((comment) => {
                const name = comment.author?.display_name || comment.author?.username || "Anonymous";
                const avatar = comment.author?.avatar_url;
                return (
                  <div key={comment.id} className="flex gap-2 p-3">
                    {avatar ? (
                      <img src={avatar} alt={name} className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900">{name}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(comment.created_at)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-400">{t("empty.title")}</div>
          )}
        </div>
      )}
    </div>
  );
}
