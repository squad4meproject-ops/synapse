"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";

interface AvatarUploadProps {
  avatarUrl: string | null;
  bannerUrl: string | null;
  displayName: string | null;
  onAvatarChange: (url: string) => void;
  onBannerChange: (url: string) => void;
}

export function AvatarUpload({
  avatarUrl,
  bannerUrl,
  displayName,
  onAvatarChange,
  onBannerChange,
}: AvatarUploadProps) {
  const t = useTranslations("profile");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const initial = (displayName || "?").charAt(0).toUpperCase();

  const handleUpload = async (file: File, type: "avatar" | "banner") => {
    const setLoading = type === "avatar" ? setAvatarLoading : setBannerLoading;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (type === "avatar") {
          onAvatarChange(data.url);
        } else {
          onBannerChange(data.url);
        }
      } else {
        const data = await res.json();
        setError(data.error || t("uploadError"));
      }
    } catch {
      setError(t("uploadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, "avatar");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, "banner");
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  return (
    <div className="mb-8">
      {/* Hidden inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleAvatarSelect}
        className="hidden"
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleBannerSelect}
        className="hidden"
      />

      {/* Banner */}
      <div className="relative">
        <button
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          disabled={bannerLoading}
          className="group relative block h-32 w-full overflow-hidden rounded-xl"
        >
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-primary-500 to-accent-500" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
            <span className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 opacity-0 shadow transition-opacity group-hover:opacity-100">
              {bannerLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
              )}
              {bannerLoading ? t("uploading") : t("changeBanner")}
            </span>
          </div>
        </button>

        {/* Avatar overlapping banner */}
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={avatarLoading}
          className="group absolute -bottom-10 left-6"
        >
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName || ""}
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary-500 to-accent-500 text-3xl font-bold text-white shadow-md">
                {initial}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40">
              {avatarLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                </svg>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Spacer for avatar overlap */}
      <div className="h-12" />

      {/* Error */}
      {error && (
        <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</div>
      )}
    </div>
  );
}
