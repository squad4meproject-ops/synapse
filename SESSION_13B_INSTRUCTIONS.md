# SESSION 13B — Corriger le Dark Mode + Remettre le Toggle

## Contexte
Synapse est une plateforme communautaire IA (Next.js 14 App Router + TypeScript + Tailwind CSS + Supabase).
En Session 13, on a tenté de désactiver le dark mode en commentant `darkMode: "class"` dans Tailwind.
**Problème** : commenter cette ligne fait basculer Tailwind en mode `"media"` (préférences OS), donc le dark mode s'applique toujours automatiquement.
Le dark mode rend **très bien** sur la page d'accueil/communauté, mais il reste des problèmes de contraste sur d'autres pages.

**Objectif** : réactiver proprement `darkMode: "class"`, restaurer le ThemeProvider et le ThemeToggle, et corriger les pages qui ont des problèmes de contraste.

## Rappel des règles du projet
- `users.id` ≠ `auth.uid()`. Mapping via `users.auth_id = auth.uid()` (UUID)
- Ne JAMAIS caster `auth.uid()` en `::text`
- API routes : `createClient()` pour auth, `createServiceClient()` pour mutations (bypass RLS)
- Traductions dans les 3 fichiers (en.json, fr.json, es.json)
- `setRequestLocale(locale)` dans chaque server component
- `Array.from(new Set(...))` au lieu de `[...new Set(...)]`

---

# PARTIE 1 — RÉACTIVER LE DARK MODE PROPREMENT

## Étape 1 — Réactiver `darkMode: "class"` dans Tailwind

**Fichier : `tailwind.config.ts`**

Décommenter la ligne `darkMode` pour qu'elle soit :
```ts
darkMode: "class",
```

(Retirer le commentaire `//` devant la ligne)

---

## Étape 2 — Restaurer le ThemeProvider complet

**Fichier : `src/components/theme/ThemeProvider.tsx`**

Remplacer TOUT le contenu par :

```tsx
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Différences avec l'ancienne version :**
- On ajoute un état `mounted` (utile pour éviter le flash)
- On écrit toujours dans `localStorage` pour garantir la cohérence
- On s'assure de bien retirer la classe `dark` si le thème est light

---

## Étape 3 — Restaurer le ThemeToggle

**Fichier : `src/components/theme/ThemeToggle.tsx`**

Remplacer TOUT le contenu par :

```tsx
"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-primary-400"
      aria-label={theme === "light" ? "Activer le mode sombre" : "Activer le mode clair"}
      title={theme === "light" ? "Mode sombre" : "Mode clair"}
    >
      {theme === "light" ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      )}
    </button>
  );
}
```

---

## Étape 4 — Remettre les classes `dark:` sur le body

**Fichier : `src/app/[locale]/layout.tsx`**

Remplacer la ligne du `<body>` :
```tsx
<body className="flex min-h-screen flex-col font-sans antialiased bg-white text-gray-900">
```
Par :
```tsx
<body className="flex min-h-screen flex-col font-sans antialiased bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
```

---

## Étape 5 — Remettre les classes `dark:` dans globals.css

**Fichier : `src/app/globals.css`**

Dans le bloc `@layer base`, le body doit être :
```css
body {
  @apply bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100;
}
```

---

# PARTIE 2 — CORRIGER LE CONTRASTE SUR LES PAGES PROBLÉMATIQUES

## Étape 6 — Page "À propos" (About)

**Fichier : `src/app/[locale]/about/page.tsx`**

Cette page n'a AUCUNE classe `dark:`. Il faut en ajouter.

**6a.** Le titre `<h1>` :
```tsx
// AVANT :
<h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
// APRÈS :
<h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
```

**6b.** La description `<p>` :
```tsx
// AVANT :
<p className="mt-4 text-lg text-gray-600">{t("description")}</p>
// APRÈS :
<p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{t("description")}</p>
```

**6c.** Les cartes de valeurs (dans le `.map`) :
```tsx
// AVANT :
className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm"
// APRÈS :
className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800"
```

**6d.** Les titres des cartes `<h3>` :
```tsx
// AVANT :
<h3 className="mt-4 text-lg font-semibold text-gray-900">
// APRÈS :
<h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
```

**6e.** Les descriptions des cartes `<p>` :
```tsx
// AVANT :
<p className="mt-2 text-sm text-gray-600">{value.description}</p>
// APRÈS :
<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{value.description}</p>
```

**6f.** Le fond de l'icône dans le cercle :
```tsx
// AVANT :
className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600"
// APRÈS :
className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
```

---

## Étape 7 — Page Profil

**Fichier : `src/app/[locale]/profile/page.tsx`**

**7a.** Le titre `<h1>` "Mon profil" n'a pas de classe couleur :
```tsx
// AVANT :
<h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>
// APRÈS :
<h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
```

**7b.** La section "Social Links" — le label sans `dark:` :
```tsx
// AVANT :
<label className="text-sm font-medium">{t("socialLinks")}</label>
// APRÈS :
<label className="text-sm font-medium dark:text-gray-200">{t("socialLinks")}</label>
```

**7c.** La section Preferences — le `<select>` sans `dark:` :
```tsx
// AVANT (dans la section defaultPostLocale) :
className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
// APRÈS :
className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
```

**7d.** Le bloc Preferences container `<div>` qui a `bg-white` :
Ce bloc a déjà `dark:bg-gray-800`, c'est bon.

---

## Étape 8 — LocaleSwitcher (sélecteur de langue)

**Fichier : `src/components/layout/LocaleSwitcher.tsx`**

Le `<select>` a un fond blanc sans variante dark. Corriger :

```tsx
// AVANT :
className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
// APRÈS :
className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
```

---

## Étape 9 — ToolFilter (filtres par catégorie sur la page Outils)

**Fichier : `src/components/tools/ToolFilter.tsx`**

Les boutons de filtre non-sélectionnés ont `bg-gray-100 text-gray-700` sans dark variant.

**9a.** Bouton "Toutes les catégories" (non sélectionné) :
```tsx
// AVANT :
: "bg-gray-100 text-gray-700 hover:bg-gray-200"
// APRÈS :
: "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
```

Appliquer le même changement aux deux endroits (le bouton "allCategories" et les boutons `.map(cat =>...)`).

---

## Étape 10 — MobileNav (menu mobile)

**Fichier : `src/components/layout/MobileNav.tsx`**

Le menu déroulant mobile n'a aucune classe `dark:`. Corriger :

**10a.** Le bouton hamburger :
```tsx
// AVANT :
className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
// APRÈS :
className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-primary-400"
```

**10b.** Le dropdown container :
```tsx
// AVANT :
className="absolute left-0 right-0 top-full z-50 animate-fade-in border-b border-gray-200 bg-white/95 shadow-soft backdrop-blur-lg"
// APRÈS :
className="absolute left-0 right-0 top-full z-50 animate-fade-in border-b border-gray-200 bg-white/95 shadow-soft backdrop-blur-lg dark:border-gray-700 dark:bg-gray-900/95"
```

**10c.** Les liens de navigation dans le dropdown :
```tsx
// AVANT :
className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
// APRÈS :
className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-primary-400"
```

**10d.** Le séparateur :
```tsx
// AVANT :
<div className="border-t border-gray-200 pt-3 mt-2">
// APRÈS :
<div className="border-t border-gray-200 pt-3 mt-2 dark:border-gray-700">
```

---

## Étape 11 — Build de vérification

```bash
npm run build
```

Le build doit passer sans erreur. Corriger toute erreur TypeScript si nécessaire.

---

# RÉCAPITULATIF

| Page | Problème | Solution |
|------|----------|----------|
| Config Tailwind | `darkMode` commenté → fallback en mode "media" | Décommenter `darkMode: "class"` |
| ThemeProvider | Neutralisé (passthrough) | Restaurer avec localStorage + class toggle |
| ThemeToggle | Retourne `null` | Restaurer le bouton sun/moon |
| Layout body | Pas de `dark:` classes | Remettre `dark:bg-gray-950 dark:text-gray-100` |
| globals.css | Pas de `dark:` classes | Remettre `dark:bg-gray-950 dark:text-gray-100` |
| Page About | Aucune classe `dark:` | Ajouter sur h1, p, cards, icônes |
| Page Profil | Titre sans couleur, select sans dark | Ajouter `dark:text-white` et `dark:bg-gray-800` |
| LocaleSwitcher | Fond blanc fixe | Ajouter `dark:bg-gray-800 dark:text-gray-200` |
| ToolFilter | Boutons gris sans dark | Ajouter `dark:bg-gray-800 dark:text-gray-300` |
| MobileNav | Aucune classe `dark:` | Ajouter dark variants partout |
