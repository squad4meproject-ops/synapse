"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

interface SocialLink {
  label: string;
  url: string;
}

interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  show_email: boolean;
  social_links: SocialLink[];
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (profile) {
        setProfile(profile);
        setDisplayName(profile.display_name ?? "");
        setUsername(profile.username ?? "");
        setBio(profile.bio ?? "");
        setShowEmail(profile.show_email ?? false);
        setSocialLinks(profile.social_links ?? []);
      }

      setLoading(false);
    }

    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("users")
      .update({
        display_name: displayName,
        username: username || null,
        bio: bio || null,
        show_email: showEmail,
        social_links: socialLinks,
      })
      .eq("auth_id", user.id);

    if (error) {
      if (error.code === "23505") {
        setMessage({ type: "error", text: t("usernameTaken") });
      } else {
        setMessage({ type: "error", text: error.message });
      }
    } else {
      setMessage({ type: "success", text: t("saved") });
      setProfile({ ...profile, display_name: displayName, username, bio, show_email: showEmail, social_links: socialLinks });
    }

    setSaving(false);
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { label: "", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  const avatarUrl = profile.avatar_url || user?.user_metadata?.avatar_url;
  const initial = (displayName || profile.email).charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>

      {/* Avatar */}
      <div className="mb-8 flex items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
            {initial}
          </div>
        )}
        <div>
          <p className="text-lg font-medium">{displayName || profile.email}</p>
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mb-6 rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
            {t("displayName")}
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium">
            {t("username")}
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("usernamePlaceholder")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Show email toggle */}
        <div className="flex items-center justify-between rounded-md border border-gray-200 p-4">
          <div>
            <p className="text-sm font-medium">{t("showEmail")}</p>
            <p className="text-xs text-gray-500">{t("showEmailDescription")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showEmail}
            onClick={() => setShowEmail(!showEmail)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              showEmail ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                showEmail ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            value={profile.email}
            disabled
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium">
            {t("bio")}
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder={t("bioPlaceholder")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Social links */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-medium">{t("socialLinks")}</label>
            <button
              type="button"
              onClick={addSocialLink}
              className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              <span className="text-lg leading-none">+</span> {t("addLink")}
            </button>
          </div>

          {socialLinks.length === 0 && (
            <p className="text-sm text-gray-400">{t("noLinks")}</p>
          )}

          <div className="space-y-3">
            {socialLinks.map((link, index) => (
              <div key={index} className="flex items-start gap-2">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => updateSocialLink(index, "label", e.target.value)}
                  placeholder={t("linkLabelPlaceholder")}
                  className="w-1/3 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                  placeholder={t("linkUrlPlaceholder")}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeSocialLink(index)}
                  className="rounded-md px-2 py-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove link"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? t("saving") : t("save")}
        </button>
      </form>
    </div>
  );
}
