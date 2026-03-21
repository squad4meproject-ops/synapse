# SESSION 9A — Refonte UI : Logo, Header, Design moderne violet/indigo

> Style : Moderne & épuré. Couleurs : Violet/Indigo. Logo : Neurone/réseau.
> Objectif : Le site doit passer de "fait à l'arrache" à "réseau social pro".

---

## Étape 1 : Créer le logo SVG

Créer le fichier `src/components/ui/Logo.tsx` :

```tsx
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Connexions (lignes) */}
      <line x1="20" y1="8" x2="10" y2="18" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="8" x2="30" y2="18" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="18" x2="14" y2="30" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="18" x2="26" y2="30" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="18" x2="30" y2="18" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="30" x2="26" y2="30" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="8" x2="20" y2="36" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="10" y1="18" x2="26" y2="30" stroke="url(#grad1)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <line x1="30" y1="18" x2="14" y2="30" stroke="url(#grad1)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />

      {/* Nœuds (cercles) */}
      <circle cx="20" cy="8" r="3.5" fill="url(#grad2)" />
      <circle cx="10" cy="18" r="3" fill="url(#grad2)" />
      <circle cx="30" cy="18" r="3" fill="url(#grad2)" />
      <circle cx="14" cy="30" r="2.5" fill="url(#grad3)" />
      <circle cx="26" cy="30" r="2.5" fill="url(#grad3)" />
      <circle cx="20" cy="36" r="2" fill="url(#grad3)" />

      {/* Reflets lumineux sur les nœuds principaux */}
      <circle cx="19" cy="7" r="1.2" fill="white" opacity="0.4" />
      <circle cx="9.2" cy="17" r="1" fill="white" opacity="0.3" />
      <circle cx="29.2" cy="17" r="1" fill="white" opacity="0.3" />

      <defs>
        <linearGradient id="grad1" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="grad2" x1="10" y1="5" x2="30" y2="20">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="grad3" x1="10" y1="25" x2="30" y2="40">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
      </defs>
    </svg>
  );
}
```

---

## Étape 2 : Mettre à jour le thème Tailwind

Modifier `tailwind.config.ts` — remplacer TOUT le contenu par :

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        accent: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "soft": "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        "card": "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 4px 20px -2px rgba(124, 58, 237, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## Étape 3 : Ajouter "Messages" dans la navigation

### 3A : Ajouter la clé de traduction

Dans `src/messages/en.json`, trouver dans "navigation" :
```json
    "community": "Community"
```
Remplacer par :
```json
    "community": "Community",
    "messages": "Messages"
```

Dans `src/messages/fr.json`, trouver dans "navigation" :
```json
    "community": "Communauté"
```
Remplacer par :
```json
    "community": "Communauté",
    "messages": "Messages"
```

Dans `src/messages/es.json`, trouver dans "navigation" :
```json
    "community": "Comunidad"
```
Remplacer par :
```json
    "community": "Comunidad",
    "messages": "Mensajes"
```

---

## Étape 4 : Refaire le Header

Remplacer TOUT le contenu de `src/components/layout/Header.tsx` par :

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { AuthButton } from "@/components/auth/AuthButton";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";
import { Logo } from "@/components/ui/Logo";

export function Header() {
  const t = useTranslations("navigation");

  const links = [
    { href: "/", label: t("home") },
    { href: "/feed", label: t("community") },
    { href: "/articles", label: t("articles") },
    { href: "/tools", label: t("tools") },
    { href: "/messages", label: t("messages") },
    { href: "/about", label: t("about") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl">
      <Container>
        <div className="relative flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo className="h-8 w-8 transition-transform group-hover:scale-105" />
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              Synapse
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-primary-50 hover:text-primary-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <LocaleSwitcher />
            <AuthButton />
          </div>

          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
```

---

## Étape 5 : Refaire le MobileNav

Remplacer TOUT le contenu de `src/components/layout/MobileNav.tsx` par :

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { AuthButton } from "@/components/auth/AuthButton";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("navigation");

  const links = [
    { href: "/", label: t("home"), icon: "🏠" },
    { href: "/feed", label: t("community"), icon: "💬" },
    { href: "/articles", label: t("articles"), icon: "📰" },
    { href: "/tools", label: t("tools"), icon: "🛠️" },
    { href: "/messages", label: t("messages"), icon: "✉️" },
    { href: "/about", label: t("about"), icon: "ℹ️" },
  ] as const;

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-3">
        <AuthButton />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 animate-fade-in border-b border-gray-200 bg-white/95 shadow-soft backdrop-blur-lg">
          <nav className="flex flex-col space-y-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
              >
                <span className="text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-3 mt-2">
              <div className="px-3 py-2">
                <LocaleSwitcher />
              </div>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
```

---

## Étape 6 : Moderniser le Hero

Remplacer TOUT le contenu de `src/components/home/HeroCompact.tsx` par :

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";

export function HeroCompact() {
  const t = useTranslations("home");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-accent-900 py-10 sm:py-14">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/10 blur-3xl" />
      </div>

      <Container className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-400/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-primary-200 backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            La communauté mondiale de l&apos;IA
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-white via-primary-100 to-primary-200 bg-clip-text text-transparent">
              {t("title")}
            </span>
          </h1>
          <p className="mt-3 text-base font-medium text-primary-200/90 sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 shadow-lg shadow-primary-950/20 transition-all hover:bg-primary-50 hover:shadow-xl"
            >
              {t("getStarted")}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              {t("exploreTools")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
```

---

## Étape 7 : Moderniser les cartes sidebar

### 7A : TrendingTools

Remplacer TOUT `src/components/home/TrendingTools.tsx` par :

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { AiTool } from "@/types";

export function TrendingTools({ tools }: { tools: AiTool[] }) {
  const t = useTranslations("home");

  if (!tools.length) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-primary-100 text-xs">🔥</span>
          {t("featuredTools")}
        </h3>
        <Link
          href="/tools"
          className="text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          {t("viewAllTools")} →
        </Link>
      </div>
      <div className="mt-4 space-y-1">
        {tools.slice(0, 5).map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.slug}`}
            className="flex items-center gap-3 rounded-xl p-2.5 transition-all hover:bg-primary-50/50"
          >
            {tool.logo_url ? (
              <img
                src={tool.logo_url}
                alt={tool.name}
                className="h-9 w-9 rounded-xl object-contain shadow-sm"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-bold text-white shadow-sm">
                {tool.name[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{tool.name}</p>
              <p className="truncate text-xs text-gray-500">{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### 7B : RecentArticles

Remplacer TOUT `src/components/home/RecentArticles.tsx` par :

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { ArticleWithTranslation } from "@/types";

export function RecentArticles({
  articles,
  locale,
}: {
  articles: ArticleWithTranslation[];
  locale: string;
}) {
  const t = useTranslations("home");

  if (!articles.length) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-accent-100 text-xs">📰</span>
          {t("latestArticles")}
        </h3>
        <Link
          href="/articles"
          className="text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          {t("viewAllArticles")} →
        </Link>
      </div>
      <div className="mt-4 space-y-1">
        {articles.slice(0, 5).map((article) => {
          const title = article.article_translations?.[0]?.title || article.slug;

          return (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="block rounded-xl p-2.5 transition-all hover:bg-accent-50/50"
            >
              <p className="text-sm font-medium text-gray-900 line-clamp-2">{title}</p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(article.published_at || article.created_at).toLocaleDateString(locale)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

### 7C : TopContributors

Remplacer TOUT `src/components/home/TopContributors.tsx` par :

```tsx
import { createClient } from "@/lib/supabase/server";

async function getTopContributors() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, display_name, username, avatar_url")
      .order("created_at", { ascending: true })
      .limit(5);

    if (error) throw error;
    return (data || []) as { id: string; display_name: string | null; username: string | null; avatar_url: string | null }[];
  } catch {
    return [];
  }
}

export async function TopContributors() {
  const contributors = await getTopContributors();

  if (!contributors.length) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover">
      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-yellow-100 text-xs">👑</span>
        Top Contributors
      </h3>
      <div className="mt-4 space-y-2">
        {contributors.map((user) => (
          <div key={user.id} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name || ""}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-primary-100"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-bold text-white ring-2 ring-primary-100">
                {(user.display_name || user.username || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user.display_name || user.username || "Anonymous"}
              </p>
              {user.username && (
                <p className="truncate text-xs text-gray-400">@{user.username}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Étape 8 : Moderniser le HomeFeed

Remplacer TOUT `src/components/home/HomeFeed.tsx` par :

```tsx
"use client";

import { Suspense } from "react";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { CategoryFilter } from "@/components/feed/CategoryFilter";
import { LoadMoreButton } from "@/components/feed/LoadMoreButton";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { Post } from "@/types/database";

export function HomeFeed({
  posts,
  locale,
  isLoggedIn,
  currentUserId,
  total = 0,
}: {
  posts: Post[];
  locale: string;
  isLoggedIn: boolean;
  currentUserId?: string;
  total?: number;
}) {
  const t = useTranslations("feed");

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
      {/* Composer */}
      <PostComposer locale={locale} isLoggedIn={isLoggedIn} />

      {/* Category Filter */}
      <Suspense fallback={null}>
        <CategoryFilter />
      </Suspense>

      {/* Posts */}
      {posts.length > 0 ? (
        <div className="divide-y divide-gray-100 px-1">
          {posts.map((post) => (
            <div key={post.id} className="p-3 sm:p-4">
              <PostCard post={post} isLoggedIn={isLoggedIn} currentUserId={currentUserId} />
            </div>
          ))}
          <div className="p-4">
            <LoadMoreButton
              initialPage={1}
              total={total}
              limit={10}
              isLoggedIn={isLoggedIn}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      ) : (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{t("empty.title")}</p>
          <p className="mt-1 text-xs text-gray-500">{t("empty.description")}</p>
        </div>
      )}

      {/* View all link */}
      <div className="border-t border-gray-100 bg-gray-50/50 p-4 text-center">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          {t("viewAll")}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
```

---

## Étape 9 : Moderniser le AuthButton

Remplacer TOUT `src/components/auth/AuthButton.tsx` par :

```tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import type { User } from "@supabase/supabase-js";

export function AuthButton() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.refresh();
    router.push("/");
  };

  if (loading) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          {t("login")}
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
        >
          {t("signup")}
        </Link>
      </div>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 rounded-full ring-2 ring-transparent transition-all hover:ring-primary-200 focus:outline-none focus:ring-primary-300"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-56 animate-fade-in rounded-xl border border-gray-100 bg-white py-1 shadow-soft">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              {t("profile")}
            </Link>

            <Link
              href="/bookmarks"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
              {t("savedPosts")}
            </Link>

            <Link
              href="/messages"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              {t("messages")}
            </Link>
          </div>

          <div className="border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Étape 10 : Moderniser le Footer

Remplacer TOUT `src/components/layout/Footer.tsx` par :

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("navigation");

  return (
    <footer className="border-t border-gray-200 bg-white">
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Logo className="h-7 w-7" />
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-lg font-bold text-transparent">
                Synapse
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-500">{t("tagline")}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Navigation</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/" className="text-sm text-gray-600 transition-colors hover:text-primary-600">
                  {nav("home")}
                </Link>
              </li>
              <li>
                <Link href="/feed" className="text-sm text-gray-600 transition-colors hover:text-primary-600">
                  {nav("community")}
                </Link>
              </li>
              <li>
                <Link href="/articles" className="text-sm text-gray-600 transition-colors hover:text-primary-600">
                  {nav("articles")}
                </Link>
              </li>
              <li>
                <Link href="/tools" className="text-sm text-gray-600 transition-colors hover:text-primary-600">
                  {nav("tools")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/legal" className="text-sm text-gray-600 transition-colors hover:text-primary-600">
                  {t("privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 transition-colors hover:text-primary-600">
                  {t("terms")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Community</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <span className="text-sm text-gray-600">GitHub</span>
              </li>
              <li>
                <span className="text-sm text-gray-600">Discord</span>
              </li>
              <li>
                <span className="text-sm text-gray-600">Twitter</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6">
          <p className="text-center text-xs text-gray-400">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </Container>
    </footer>
  );
}
```

---

## Étape 11 : Moderniser la page d'accueil (fond)

Dans `src/app/[locale]/page.tsx`, trouver :
```tsx
      <div className="bg-gray-50 py-6 sm:py-8">
```
Remplacer par :
```tsx
      <div className="bg-gradient-to-b from-gray-50 to-white py-6 sm:py-8">
```

---

## Étape 12 : Build, test, commit, push

```bash
cd C:\Users\Smartlabz\OneDrive\Documents\synapse
npm run build
```

Si le build réussit :

```bash
git add -A
git commit -m "UI redesign: add Synapse logo, modernize header/footer/sidebar/feed, violet/indigo theme, add Messages to nav"
git push
```
