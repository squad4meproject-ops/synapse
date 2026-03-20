"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up border-t border-gray-200 bg-white/95 px-4 py-4 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-center text-sm text-gray-600 sm:text-left dark:text-gray-300">
          This site uses essential cookies for authentication and language
          preferences. No tracking cookies are used.{" "}
          <Link href="/privacy" className="font-medium text-primary-600 underline hover:text-primary-700">
            Learn more
          </Link>
        </p>
        <button
          onClick={handleAccept}
          className="shrink-0 rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          OK, got it
        </button>
      </div>
    </div>
  );
}
