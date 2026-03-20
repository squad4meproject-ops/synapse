"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function FollowButton({
  userId,
  initialIsFollowing,
}: {
  userId: string;
  initialIsFollowing: boolean;
}) {
  const t = useTranslations("profile");
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [hovering, setHovering] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  if (isFollowing) {
    return (
      <button
        onClick={handleToggle}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
          hovering
            ? "border border-red-300 bg-red-50 text-red-600"
            : "border border-primary-300 bg-primary-50 text-primary-700"
        }`}
      >
        {loading ? "..." : hovering ? t("unfollow") : t("following")}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-primary-600 bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-700 disabled:opacity-50"
    >
      {loading ? "..." : t("follow")}
    </button>
  );
}
