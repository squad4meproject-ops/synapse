"use client";

import type { ReactNode } from "react";

// Dark mode désactivé temporairement — ce composant est un simple passthrough
export function useTheme() {
  return { theme: "light" as const, toggleTheme: () => {} };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
