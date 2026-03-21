"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface Stats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalBadges: number;
}

interface PostData {
  id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  is_sponsored: boolean;
  created_at: string;
  author?: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_premium: boolean;
  created_at: string;
}

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
}

export function AdminDashboard() {
  const t = useTranslations("admin");
  const [activeTab, setActiveTab] = useState<"stats" | "posts" | "users" | "sponsored" | "badges">("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("");
  const [awardingBadge, setAwardingBadge] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === "posts") {
      loadPosts();
    } else if (activeTab === "users") {
      loadUsers();
    } else if (activeTab === "badges") {
      loadBadges();
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/posts");
      if (res.ok) {
        setPosts(await res.json());
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBadges = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/badges");
      if (res.ok) {
        setBadges(await res.json());
      }
    } catch (error) {
      console.error("Error loading badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm(t("confirmDelete"))) return;

    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, is_admin: data.is_admin } : u
          )
        );
      }
    } catch (error) {
      console.error("Error toggling admin role:", error);
    }
  };

  const handleAwardBadge = async () => {
    if (!selectedUser || !selectedBadge) return;

    setAwardingBadge(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser}/badge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge_id: selectedBadge }),
      });
      if (res.ok) {
        setSelectedUser("");
        setSelectedBadge("");
        alert("Badge awarded successfully!");
      }
    } catch (error) {
      console.error("Error awarding badge:", error);
    } finally {
      setAwardingBadge(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t("stats")}</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              label={t("totalUsers")}
              value={stats.totalUsers}
            />
            <StatsCard
              label={t("totalPosts")}
              value={stats.totalPosts}
            />
            <StatsCard
              label={t("totalComments")}
              value={stats.totalComments}
            />
            <StatsCard
              label="Badges"
              value={stats.totalBadges}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {(["stats", "posts", "users", "sponsored", "badges"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                {tab === "stats" && t("stats")}
                {tab === "posts" && t("posts")}
                {tab === "users" && t("users")}
                {tab === "sponsored" && t("sponsored")}
                {tab === "badges" && t("badges")}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "stats" && stats && (
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div>
                  <span className="font-semibold">{t("totalUsers")}:</span> {stats.totalUsers}
                </div>
                <div>
                  <span className="font-semibold">{t("totalPosts")}:</span> {stats.totalPosts}
                </div>
                <div>
                  <span className="font-semibold">{t("totalComments")}:</span> {stats.totalComments}
                </div>
              </div>
            )}

            {activeTab === "posts" && (
              <div className="space-y-4">
                {loading ? (
                  <p className="text-gray-500">{t("stats")}</p>
                ) : posts.length === 0 ? (
                  <p className="text-gray-500">No posts found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">Content</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">Author</th>
                          <th className="text-center py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">Likes</th>
                          <th className="text-center py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">Comments</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {posts.map((post) => (
                          <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="py-3 px-3 text-gray-700 dark:text-gray-300 truncate max-w-xs">
                              {post.content}
                            </td>
                            <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                              {post.author?.display_name || post.author?.username || "Unknown"}
                            </td>
                            <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300">
                              {post.likes_count}
                            </td>
                            <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300">
                              {post.comments_count}
                            </td>
                            <td className="py-3 px-3">
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                              >
                                {t("deletePost")}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-4">
                {loading ? (
                  <p className="text-gray-500">Loading...</p>
                ) : users.length === 0 ? (
                  <p className="text-gray-500">No users found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">Name</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">Email</th>
                          <th className="text-center py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">Admin</th>
                          <th className="text-center py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">Premium</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-900 dark:text-gray-100">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                              {user.display_name || user.username || "Unknown"}
                            </td>
                            <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{user.email}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block px-2 py-1 text-xs rounded ${
                                user.is_admin
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}>
                                {user.is_admin ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block px-2 py-1 text-xs rounded ${
                                user.is_premium
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}>
                                {user.is_premium ? "Yes" : "No"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <button
                                onClick={() => handleToggleAdmin(user.id)}
                                className="px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition-colors"
                              >
                                {user.is_admin ? t("removeAdmin") : t("makeAdmin")}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "sponsored" && (
              <div className="text-gray-700 dark:text-gray-300">
                <p>Sponsored posts management coming soon...</p>
              </div>
            )}

            {activeTab === "badges" && (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t("awardBadge")}</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t("selectUser")}
                      </label>
                      <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Choose a user...</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.display_name || user.username || user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t("selectBadge")}
                      </label>
                      <select
                        value={selectedBadge}
                        onChange={(e) => setSelectedBadge(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Choose a badge...</option>
                        {badges.map((badge) => (
                          <option key={badge.id} value={badge.id}>
                            {badge.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAwardBadge}
                      disabled={!selectedUser || !selectedBadge || awardingBadge}
                      className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      {awardingBadge ? "Awarding..." : t("awardBadge")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
    </div>
  );
}
