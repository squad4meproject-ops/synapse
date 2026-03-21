"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import type { PostCategory } from "@/types/database";

const categories: { value: PostCategory; icon: string }[] = [
  { value: "creation", icon: "🎨" },
  { value: "prompt", icon: "💡" },
  { value: "question", icon: "❓" },
  { value: "discussion", icon: "💬" },
  { value: "tool_review", icon: "⭐" },
];

export function PostComposer({ locale, isLoggedIn, spaceId }: { locale: string; isLoggedIn: boolean; spaceId?: string }) {
  const t = useTranslations("feed");
  const router = useRouter();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("discussion");
  const [promptContent, setPromptContent] = useState("");
  const [showPromptField, setShowPromptField] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkField, setShowLinkField] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isLoggedIn) {
    return (
      <div className="border-b border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">{t("composer.loginToPost")}</p>
      </div>
    );
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImages = 4;
    const remaining = maxImages - images.length;
    const newFiles = files.slice(0, remaining);

    if (newFiles.length === 0) return;

    setImages(prev => [...prev, ...newFiles]);

    // Créer les previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset l'input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      // Upload des images d'abord
      let imageUrls: string[] = [];
      if (images.length > 0) {
        setUploading(true);
        const uploadPromises = images.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
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
        });
        const results = await Promise.all(uploadPromises);
        imageUrls = results.filter(Boolean) as string[];
        setUploading(false);

        // Si certains uploads ont échoué
        if (imageUrls.length < images.length) {
          console.warn(`Only ${imageUrls.length}/${images.length} images uploaded successfully`);
        }
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          content: content.trim(),
          prompt_content: promptContent.trim() || null,
          link_url: linkUrl.trim() || null,
          locale,
          image_urls: imageUrls.length > 0 ? imageUrls : undefined,
          space_id: spaceId || undefined,
        }),
      });

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
        try {
          const data = await res.json();
          setError(data.error || `Publication failed (status ${res.status})`);
        } catch {
          setError(`Publication failed (status ${res.status})`);
        }
      }
    } catch {
      setError('Failed to publish. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-900">
      {/* Category selector */}
      <div className="mb-3 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === cat.value
                ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:ring-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            <span>{cat.icon}</span>
            {t(`categories.${cat.value}`)}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Text area */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("composer.placeholder")}
        rows={3}
        className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Image previews */}
      {imagePreviews.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="group relative">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Prompt field */}
      {showPromptField && (
        <textarea
          value={promptContent}
          onChange={(e) => setPromptContent(e.target.value)}
          placeholder={t("composer.promptPlaceholder")}
          rows={3}
          className="mt-2 w-full resize-none rounded-lg border border-primary-200 bg-primary-50 p-3 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-primary-900/50 dark:bg-primary-900/20 dark:text-gray-100 dark:placeholder-gray-500"
        />
      )}

      {/* Link field */}
      {showLinkField && (
        <input
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder={t("composer.linkPlaceholder")}
          className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
      )}

      {/* Action bar */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 4}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              images.length > 0
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            } disabled:opacity-50`}
          >
            📷 {t("composer.addImage")} {images.length > 0 ? `(${images.length}/4)` : ""}
          </button>
          <button
            onClick={() => setShowPromptField(!showPromptField)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showPromptField
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            💡 {t("composer.addPrompt")}
          </button>
          <button
            onClick={() => setShowLinkField(!showLinkField)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showLinkField
                ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
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
          {submitting ? (uploading ? "Uploading..." : t("composer.publishing")) : t("composer.publish")}
        </button>
      </div>
    </div>
  );
}
