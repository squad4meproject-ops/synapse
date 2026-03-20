"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
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

export function PostCard({ post }: { post: Post }) {
  const t = useTranslations("feed");
  const currentLocale = useLocale();
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [saved, setSaved] = useState(post.is_saved || false);
  const [savesCount, setSavesCount] = useState(post.saves_count);
  const [likeLoading, setLikeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

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

  const handleTranslate = () => {
    const text = encodeURIComponent(post.content);
    const url = `https://translate.google.com/?sl=${post.locale}&tl=${currentLocale}&text=${text}&op=translate`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="border-b border-gray-200 bg-white p-4 sm:p-6">
      {/* Header: Avatar + Author + Category + Time */}
      <div className="flex items-start gap-3">
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt={authorName}
            className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
            {authorInitial}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{authorName}</span>
            {author?.username && (
              <span className="text-sm text-gray-500">@{author.username}</span>
            )}
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{timeAgo(post.created_at)}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-xs">{categoryIcons[post.category]}</span>
            <span className="text-xs font-medium text-primary-600">
              {t(`categories.${post.category}`)}
            </span>
            {/* Language badge */}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase text-gray-500">
              {post.locale}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-3 pl-13">
        <p className="whitespace-pre-wrap text-gray-900">{post.content}</p>

        {/* Translate button (if post is in another language) */}
        {isOtherLanguage && (
          <button
            onClick={handleTranslate}
            className="mt-2 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            🌐 {t("post.translate", { lang: langNames[currentLocale] || currentLocale })}
          </button>
        )}

        {/* Prompt block */}
        {post.prompt_content && (
          <div className="mt-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-primary-700">Prompt</span>
              <button
                onClick={copyPrompt}
                className="rounded px-2 py-0.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-100"
              >
                {t("post.copyPrompt")}
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-gray-800">
              {post.prompt_content}
            </pre>
          </div>
        )}

        {/* Link preview */}
        {post.link_url && (
          <a
            href={post.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block overflow-hidden rounded-lg border border-gray-200 transition-colors hover:bg-gray-50"
          >
            <div className="p-3">
              <p className="text-sm font-medium text-primary-600 hover:underline">
                {post.link_url}
              </p>
            </div>
          </a>
        )}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div
            className={`mt-3 grid gap-1 overflow-hidden rounded-xl border border-gray-200 ${
              post.images.length === 1
                ? "grid-cols-1"
                : post.images.length === 2
                ? "grid-cols-2"
                : post.images.length === 3
                ? "grid-cols-2"
                : "grid-cols-2"
            }`}
          >
            {post.images.slice(0, 4).map((image, idx) => (
              <img
                key={image.id}
                src={image.image_url}
                alt={image.alt_text || `Image ${idx + 1}`}
                className={`w-full object-cover ${
                  post.images!.length === 1 ? "max-h-96" : "h-48"
                } ${post.images!.length === 3 && idx === 0 ? "row-span-2 h-full" : ""}`}
              />
            ))}
          </div>
        )}

        {/* Actions: Like, Comment, Save */}
        <div className="mt-3 flex items-center gap-6">
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 ${
              liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            }`}
          >
            <span>{liked ? "❤️" : "🤍"}</span>
            <span>{likesCount > 0 ? likesCount : ""}</span>
          </button>

          <button className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary-600">
            <span>💬</span>
            <span>{post.comments_count > 0 ? post.comments_count : ""}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saveLoading}
            className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 ${
              saved ? "text-primary-600" : "text-gray-500 hover:text-primary-600"
            }`}
          >
            <span>{saved ? "🔖" : "📑"}</span>
            <span>{savesCount > 0 ? savesCount : ""}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
