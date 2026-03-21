"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface SearchResults {
  posts: { id: string; content: string; author: { display_name: string | null; username: string | null } | null; created_at: string }[];
  users: { id: string; display_name: string | null; username: string | null; avatar_url: string | null; bio: string | null }[];
  articles: { id: string; title: string; excerpt: string | null; slug: string }[];
  tools: { id: string; name: string; description: string | null; slug: string; logo_url: string | null }[];
}

export function SearchBar() {
  const t = useTranslations("search");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=3`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setIsOpen(false);
  };

  const navigate = (path: string) => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
    router.push(path);
  };

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasResults = results && (
    results.users.length > 0 ||
    results.posts.length > 0 ||
    results.articles.length > 0 ||
    results.tools.length > 0
  );

  return (
    <div className="relative" ref={containerRef}>
      {/* Input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results) setIsOpen(true); }}
          placeholder={t("placeholder")}
          className="w-48 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-8 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 lg:w-64 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:bg-gray-800"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-1 w-full min-w-[320px] animate-fade-in rounded-xl border border-gray-200 bg-white shadow-card max-h-96 overflow-y-auto z-50 dark:border-gray-700 dark:bg-gray-900">
          {loading ? (
            <div className="px-4 py-6 text-center">
              <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <p className="mt-2 text-xs text-gray-400">{t("searching")}</p>
            </div>
          ) : hasResults ? (
            <div className="py-1">
              {/* Users */}
              {results!.users.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t("users")}</p>
                  {results!.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => navigate(`/user/${user.username || user.id}`)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-bold text-white">
                          {(user.display_name || user.username || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{user.display_name || user.username}</p>
                        {user.username && <p className="truncate text-xs text-gray-500 dark:text-gray-400">@{user.username}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Posts */}
              {results!.posts.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t("posts")}</p>
                  {results!.posts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => navigate("/feed")}
                      className="block w-full px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <p className="truncate text-sm text-gray-900 dark:text-gray-100">{post.content.slice(0, 80)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {post.author?.display_name || post.author?.username || "Anonymous"}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Articles */}
              {results!.articles.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t("articles")}</p>
                  {results!.articles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => navigate(`/articles/${article.slug}`)}
                      className="block w-full px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{article.title}</p>
                      {article.excerpt && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{article.excerpt}</p>}
                    </button>
                  ))}
                </div>
              )}

              {/* Tools */}
              {results!.tools.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{t("tools")}</p>
                  {results!.tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => navigate(`/tools/${tool.slug}`)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {tool.logo_url ? (
                        <img src={tool.logo_url} alt="" className="h-7 w-7 rounded-lg object-contain" />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                          {tool.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{tool.name}</p>
                        {tool.description && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{tool.description}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : query.length >= 2 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">{t("noResults", { query })}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
