"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

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
  banner_url: string | null;
  bio: string | null;
  show_email: boolean;
  social_links: SocialLink[];
  preferences: {
    default_post_locale?: string;
    profile_visible?: boolean;
    email_notifications?: boolean;
  } | null;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [defaultPostLocale, setDefaultPostLocale] = useState("en");
  const [profileVisible, setProfileVisible] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [stats, setStats] = useState({ postsCount: 0, commentsCount: 0, likesReceived: 0 });

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
        const prefs = profile.preferences || {};
        setDefaultPostLocale(prefs.default_post_locale || 'en');
        setProfileVisible(prefs.profile_visible !== false);
        setEmailNotifications(prefs.email_notifications || false);
      }

      setLoading(false);
    }

    load();
    fetch('/api/account/stats').then(res => res.json()).then(setStats).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setSaving(true);
    setMessage(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("users") as any)
      .update({
        display_name: displayName,
        username: username || null,
        bio: bio || null,
        show_email: showEmail,
        social_links: socialLinks,
        preferences: {
          default_post_locale: defaultPostLocale,
          profile_visible: profileVisible,
          email_notifications: emailNotifications,
        },
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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
      });

      if (response.ok) {
        await supabase.auth.signOut();
        router.push('/');
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || t("deleteFailed") });
      }
    } catch {
      setMessage({ type: 'error', text: t("deleteFailed") });
    }
    setDeleting(false);
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>

      {/* Avatar & Banner Upload */}
      <AvatarUpload
        avatarUrl={avatarUrl}
        bannerUrl={profile.banner_url}
        displayName={displayName}
        onAvatarChange={(url) => {
          setProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
        }}
        onBannerChange={(url) => {
          setProfile(prev => prev ? { ...prev, banner_url: url } : prev);
        }}
      />
      <div className="mb-4">
        <p className="text-lg font-medium">{displayName || profile.email}</p>
        <p className="text-sm text-gray-500">{profile.email}</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.postsCount}</p>
          <p className="text-xs text-gray-500">{t("postsCount")}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.commentsCount}</p>
          <p className="text-xs text-gray-500">{t("commentsCount")}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-500">{stats.likesReceived}</p>
          <p className="text-xs text-gray-500">{t("likesReceived")}</p>
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

      {/* Preferences */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("preferences")}</h2>

        {/* Default post language */}
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">{t("defaultPostLanguage")}</label>
          <select
            value={defaultPostLocale}
            onChange={(e) => setDefaultPostLocale(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">{t("defaultPostLanguageDesc")}</p>
        </div>

        {/* Profile visibility toggle */}
        <div className="mt-4 flex items-center justify-between rounded-md border border-gray-200 p-4">
          <div>
            <p className="text-sm font-medium">{t("publicProfile")}</p>
            <p className="text-xs text-gray-500">{t("publicProfileDesc")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={profileVisible}
            onClick={() => setProfileVisible(!profileVisible)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              profileVisible ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                profileVisible ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Email notifications toggle */}
        <div className="mt-4 flex items-center justify-between rounded-md border border-gray-200 p-4">
          <div>
            <p className="text-sm font-medium">{t("emailNotifications")}</p>
            <p className="text-xs text-gray-500">{t("emailNotificationsDesc")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emailNotifications}
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              emailNotifications ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                emailNotifications ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <button
          onClick={(e) => handleSave(e as unknown as React.FormEvent)}
          disabled={saving}
          className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? t("saving") : t("savePreferences")}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="mt-12 rounded-lg border-2 border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700">{t("deleteAccount")}</h2>
        <p className="mt-2 text-sm text-red-600">{t("deleteAccountWarning")}</p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {t("deleteAccount")}
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-red-700">{t("deleteAccountConfirm")}</p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full rounded-md border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              placeholder={t("deleteConfirmPlaceholder")}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={(deleteConfirmText !== "DELETE" && deleteConfirmText !== "SUPPRIMER" && deleteConfirmText !== "ELIMINAR") || deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? t("deleting") : t("deleteAccountButton")}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t("cancelAction")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
