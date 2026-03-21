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
          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-primary-400"
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
        <div className="absolute left-0 right-0 top-full z-50 animate-fade-in border-b border-gray-200 bg-white/95 shadow-soft backdrop-blur-lg dark:border-gray-700 dark:bg-gray-900/95">
          <nav className="flex flex-col space-y-1 px-4 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-primary-400"
              >
                <span className="text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-3 mt-2 dark:border-gray-700">
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
