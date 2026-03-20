"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { PostCategory } from "@/types/database";

const categories: { value: PostCategory; icon: string }[] = [
  { value: "creation", icon: "🎨" },
  { value: "prompt", icon: "💡" },
  { value: "question", icon: "❓" },
  { value: "discussion", icon: "💬" },
  { value: "tool_review", icon: "⭐" },
];

export function PostComposer({ locale, isLoggedIn }: { locale: string; isLoggedIn: boolean }) {
  const t = useTranslations("feed");
  const router = useRouter();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("discussion");
  const [promptContent, setPromptContent] = useState("");
  const [showPromptField, setShowPromptField] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkField, setShowLinkField] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="border-b border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-500">{t("composer.loginToPost")}</p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          content: content.trim(),
          prompt_content: promptContent.trim() || null,
          link_url: linkUrl.trim() || null,
          locale,
        }),
      });

      if (res.ok) {
        setContent("");
        setPromptContent("");
        setLinkUrl("");
        setShowPromptField(false);
        setShowLinkField(false);
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white p-4 sm:p-6">
      {/* Category selector */}
      <div className="mb-3 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === cat.value
                ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{cat.icon}</span>
            {t(`categories.${cat.value}`)}
          </button>
        ))}
      </div>

      {/* Text area */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("composer.placeholder")}
        rows={3}
        className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      {/* Prompt field */}
      {showPromptField && (
        <textarea
          value={promptContent}
          onChange={(e) => setPromptContent(e.target.value)}
          placeholder={t("composer.promptPlaceholder")}
          rows={3}
          className="mt-2 w-full resize-none rounded-lg border border-primary-200 bg-primary-50 p-3 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      )}

      {/* Link field */}
      {showLinkField && (
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder={t("composer.linkPlaceholder")}
          className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      )}

      {/* Action bar */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setShowPromptField(!showPromptField)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showPromptField
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            💡 {t("composer.addPrompt")}
          </button>
          <button
            onClick={() => setShowLinkField(!showLinkField)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showLinkField
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            🔗 {t("composer.addLink")}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
          className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t("composer.publishing") : t("composer.publish")}
        </button>
      </div>
    </div>
  );
}
