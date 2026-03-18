export type { Database } from "./database";

import type { Database } from "./database";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Article = Tables<"articles">;
export type ArticleTranslation = Tables<"article_translations">;
export type AiTool = Tables<"ai_tools">;
export type User = Tables<"users">;

export type ArticleWithTranslation = Article & {
  article_translations: ArticleTranslation[];
  users: Pick<User, "display_name" | "avatar_url"> | null;
};

export type Locale = "en" | "fr" | "es";
