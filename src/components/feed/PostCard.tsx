"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CommentSection } from "./CommentSection";
import { Link } from "@/i18n/routing";
import type { Post } from "@/types/database";

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString();
}

const categoryIcons: Record<string, string> = {
  creation: "🎨",
  prompt: "💡",
  question: "❓",
  discussion: "💬",
  tool_review: "⭐",
};

const langNames: Record<string, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
};

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg className="h-5 w-5 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
  );
}

export function PostCard({
  post,
  isLoggedIn = false,
  currentUserId,
  onDeleted,
}: {
  post: Post;
  isLoggedIn?: boolean;
  currentUserId?: string;
  onDeleted?: () => void;
}) {
  const t = useTranslations("feed");
  const currentLocale = useLocale();
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.is_saved || false);
  const [savesCount, setSavesCount] = useState(post.saves_count);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pinned, setPinned] = useState(post.is_pinned || false);
  const [pinLoading, setPinLoading] = useState(false);

  const isOwner = currentUserId && post.author_id === currentUserId;

  const handlePin = async () => {
    if (pinLoading) return;
    setPinLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/pin`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPinned(data.pinned);
      }
    } catch {
      // fail silently
    } finally {
      setPinLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteLoading) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/delete`, { method: 'DELETE' });
      if (res.ok) {
        if (onDeleted) onDeleted();
        else window.location.reload();
      }
    } catch {
      // fail silently
    } finally {
      setDeleteLoading(false);
    }
  };

  const author = post.author as Record<string, string | null> | undefined;
  const authorName = author?.display_name || author?.username || "Anonymous";
  const authorAvatar = author?.avatar_url;
  const authorInitial = authorName.charAt(0).toUpperCase();
  const isOtherLanguage = post.locale !== currentLocale;

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.error) return;
      setLiked(data.liked);
      setLikesCount((prev) => (data.liked ? prev + 1 : prev - 1));
    } catch {
      // silently fail
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSave = async () => {
    if (saveLoading) return;
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/bookmark`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.error) return;
      setSaved(data.saved);
      setSavesCount((prev) => (data.saved ? prev + 1 : prev - 1));
    } catch {
      // silently fail
    } finally {
      setSaveLoading(false);
    }
  };

  const copyPrompt = () => {
    if (post.prompt_content) {
      navigator.clipboard.writeText(post.prompt_content);
    }
  };

  const handleTranslate = async () => {
    if (translating) return;
    if (translatedText) {
      setTranslatedText(null);
      return;
    }
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: post.content,
          from: post.locale,
          to: currentLocale,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslatedText(data.translated);
      } else {
        setTranslateError('Translation unavailable');
        setTimeout(() => setTranslateError(null), 3000);
      }
    } catch {
      setTranslateError('Translation unavailable');
      setTimeout(() => setTranslateError(null), 3000);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800">
      {/* Pinned badge */}
      {pinned && (
        <div className="mb-2 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <span>📌</span> {t("post.pinned") || "Pinned"}
        </div>
      )}

      {/* Sponsored badge */}
      {post.is_sponsored && (
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            💰 {t("post.sponsored") || "Sponsored"}
          </span>
          {post.sponsor_label && post.sponsor_url ? (
            <a
              href={post.sponsor_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-medium text-amber-700 hover:underline dark:text-amber-400"
            >
              {post.sponsor_label}
            </a>
          ) : post.sponsor_label ? (
            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">{post.sponsor_label}</span>
          ) : null}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        {authorAvatar ? (
          <img src={authorAvatar} alt={authorName} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
            {authorInitial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {author?.username ? (
              <Link href={`/user/${author.username}`} className="font-semibold text-gray-900 hover:underline">
                {authorName}
              </Link>
            ) : (
              <span className="font-semibold text-gray-900">{authorName}</span>
            )}
            {author?.username && (
              <Link href={`/user/${author.username}`} className="text-sm text-gray-500 hover:text-primary-600 hover:underline">
                @{author.username}
              </Link>
            )}
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{timeAgo(post.created_at)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs">{categoryIcons[post.category]}</span>
            <span className="text-xs font-medium text-primary-600">{t(`categories.${post.category}`)}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-500">{post.locale}</span>
          </div>
        </div>
        {isOwner && (
          <div className="relative ml-auto">
            {!showDeleteConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePin}
                  disabled={pinLoading}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-amber-600 disabled:opacity-50 dark:hover:bg-gray-700"
                  aria-label={pinned ? "Unpin" : "Pin"}
                  title={pinned ? (t("post.unpin") || "Unpin") : (t("post.pin") || "Pin")}
                >
                  <svg className={`h-4 w-4 ${pinned ? "text-amber-500" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                  aria-label="More options"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? "..." : t("post.delete")}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  {t("post.cancel") || "Cancel"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-3 pl-13">
        <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{post.content}</p>

        {/* Translated text (inline) */}
        {translatedText && (
          <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-blue-600">
                🌐 {langNames[currentLocale] || currentLocale}
              </span>
              <button onClick={() => setTranslatedText(null)} className="text-[10px] text-blue-500 hover:underline">✕</button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-800">{translatedText}</p>
          </div>
        )}

        {/* Translate button */}
        {isOtherLanguage && (
          <button
            onClick={handleTranslate}
            disabled={translating}
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
          >
            🌐 {translating ? "..." : translatedText ? t("post.translate", { lang: langNames[post.locale] || post.locale }) : t("post.translate", { lang: langNames[currentLocale] || currentLocale })}
          </button>
        )}
        {translateError && (
          <span className="ml-2 text-xs text-red-500">{translateError}</span>
        )}

        {/* Prompt block */}
        {post.prompt_content && (
          <div className="mt-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-primary-700">Prompt</span>
              <button onClick={copyPrompt} className="rounded px-2 py-0.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-100">
                {t("post.copyPrompt")}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-gray-800">{post.prompt_content}</pre>
          </div>
        )}

        {/* Link preview */}
        {post.link_url && (
          <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-lg border border-gray-200 transition-colors hover:bg-gray-50">
            <div className="p-3">
              <p className="text-sm font-medium text-primary-600 hover:underline">{post.link_url}</p>
            </div>
          </a>
        )}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className={`mt-3 grid gap-1 overflow-hidden rounded-xl border border-gray-200 ${
            post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}>
            {post.images.slice(0, 4).map((image, idx) => (
              <img key={image.id} src={image.image_url} alt={image.alt_text || `Image ${idx + 1}`}
                className={`w-full object-cover ${post.images!.length === 1 ? "max-h-96" : "h-48"} ${post.images!.length === 3 && idx === 0 ? "row-span-2 h-full" : ""}`} />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-6">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-1.5 transition-colors disabled:opacity-50 ${liked ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
          >
            <HeartIcon filled={liked} />
            <span className="text-sm font-medium">{likesCount > 0 ? likesCount : ""}</span>
          </button>

          {/* Comment */}
          <CommentSection postId={post.id} isLoggedIn={isLoggedIn} initialCount={post.comments_count} />

          {/* Bookmark */}
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className={`flex items-center gap-1.5 transition-colors disabled:opacity-50 ${saved ? "text-primary-600" : "text-gray-400 hover:text-primary-600"}`}
          >
            <BookmarkIcon filled={saved} />
            <span className="text-sm font-medium">{savesCount > 0 ? savesCount : ""}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
