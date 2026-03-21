"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  likes_count: number;
  is_liked: boolean;
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

function CommentItem({
  comment,
  postId,
  isLoggedIn,
  onReplyAdded,
  allComments,
  onCommentLikeToggle,
}: {
  comment: CommentData;
  postId: string;
  isLoggedIn: boolean;
  onReplyAdded: () => void;
  allComments: CommentData[];
  onCommentLikeToggle: (commentId: string) => void;
}) {
  const t = useTranslations("feed");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [liking, setLiking] = useState(false);

  const replies = allComments.filter((c) => c.parent_id === comment.id);

  const handleReplySubmit = async () => {
    if (!replyText.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText.trim(),
          parent_id: comment.id,
        }),
      });
      if (res.ok) {
        setReplyText("");
        setShowReplyInput(false);
        onReplyAdded();
      }
    } catch {
      // fail silently
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleLike = async () => {
    if (liking || !isLoggedIn) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}/like`, {
        method: "POST",
      });
      if (res.ok) {
        onCommentLikeToggle(comment.id);
      }
    } catch {
      // fail silently
    } finally {
      setLiking(false);
    }
  };

  const name = comment.author?.display_name || comment.author?.username || "Anonymous";
  const avatar = comment.author?.avatar_url;

  return (
    <div className="space-y-0">
      <div className="flex gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30">
        {avatar ? (
          <img src={avatar} alt={name} className="h-7 w-7 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-[10px] font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{name}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>

          {/* Action buttons */}
          <div className="mt-2 flex gap-4">
            {isLoggedIn && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="text-xs text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                {t("comments.reply")}
              </button>
            )}
            <button
              onClick={handleLike}
              disabled={liking || !isLoggedIn}
              className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-red-500 disabled:opacity-50 dark:text-gray-400 dark:hover:text-red-400"
            >
              <svg className={`h-3.5 w-3.5 ${comment.is_liked ? 'fill-red-500 text-red-500' : ''}`} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" fill={comment.is_liked ? 'currentColor' : 'none'}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-1.085-.667-2.025-1.587-2.431a54.24 54.24 0 00-3.795-3.48 3 3 0 00-5.233 0 54.22 54.22 0 00-3.796 3.48C5.667 6.225 5 7.165 5 8.25v7.5a3 3 0 003 3h8.25a3 3 0 003-3V8.25z" />
              </svg>
              {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
            </button>
          </div>

          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReplySubmit()}
                placeholder={t("comments.replyPlaceholder")}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim() || submittingReply}
                className="rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {submittingReply ? "..." : t("comments.reply")}
              </button>
            </div>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-2 border-l-2 border-gray-200 dark:border-gray-700">
              {!showReplies ? (
                <button
                  onClick={() => setShowReplies(true)}
                  className="text-xs text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 pl-3 py-1"
                >
                  {t("comments.showReplies", { count: replies.length })}
                </button>
              ) : (
                <div>
                  {replies.map((reply) => (
                    <div key={reply.id} className="border-l-2 border-gray-200 dark:border-gray-700">
                      <CommentItem
                        comment={reply}
                        postId={postId}
                        isLoggedIn={isLoggedIn}
                        onReplyAdded={onReplyAdded}
                        allComments={allComments}
                        onCommentLikeToggle={onCommentLikeToggle}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setShowReplies(false)}
                    className="text-xs text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 pl-3 py-1"
                  >
                    {t("comments.hideReplies")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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

  const handleCommentLikeToggle = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              is_liked: !c.is_liked,
              likes_count: c.is_liked ? c.likes_count - 1 : c.likes_count + 1,
            }
          : c
      )
    );
  };

  // Top-level comments only
  const topLevelComments = comments.filter((c) => !c.parent_id);

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
        </svg>
        <span>{count > 0 ? count : ""}</span>
      </button>

      {/* Comments panel */}
      {isOpen && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {/* Comment input */}
          {isLoggedIn ? (
            <div className="flex gap-2 border-b border-gray-200 p-3 dark:border-gray-700">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={t("comments.placeholder")}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
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
            <div className="border-b border-gray-200 p-3 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {t("comments.loginToComment")}
            </div>
          )}

          {/* Comments list */}
          {loading ? (
            <div className="p-4 text-center text-xs text-gray-400">{t("comments.loading") || "..."}</div>
          ) : topLevelComments.length > 0 ? (
            <div className="max-h-96 divide-y divide-gray-200 overflow-y-auto dark:divide-gray-700">
              {topLevelComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={postId}
                  isLoggedIn={isLoggedIn}
                  onReplyAdded={loadComments}
                  allComments={comments}
                  onCommentLikeToggle={handleCommentLikeToggle}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-400">{t("empty.title")}</div>
          )}
        </div>
      )}
    </div>
  );
}
