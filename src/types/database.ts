export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          username: string | null;
          role: string;
          auth_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          username?: string | null;
          role?: string;
          auth_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          username?: string | null;
          role?: string;
          auth_id?: string | null;
          created_at?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          author_id: string;
          cover_image_url: string | null;
          published_at: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          author_id: string;
          cover_image_url?: string | null;
          published_at?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          author_id?: string;
          cover_image_url?: string | null;
          published_at?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      article_translations: {
        Row: {
          id: string;
          article_id: string;
          locale: string;
          title: string;
          excerpt: string | null;
          content: string;
          meta_title: string | null;
          meta_description: string | null;
        };
        Insert: {
          id?: string;
          article_id: string;
          locale: string;
          title: string;
          excerpt?: string | null;
          content: string;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Update: {
          id?: string;
          article_id?: string;
          locale?: string;
          title?: string;
          excerpt?: string | null;
          content?: string;
          meta_title?: string | null;
          meta_description?: string | null;
        };
      };
      ai_tools: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          logo_url: string | null;
          website_url: string;
          category: string;
          pricing: "free" | "freemium" | "paid";
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          logo_url?: string | null;
          website_url: string;
          category: string;
          pricing?: "free" | "freemium" | "paid";
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string;
          logo_url?: string | null;
          website_url?: string;
          category?: string;
          pricing?: "free" | "freemium" | "paid";
          is_featured?: boolean;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      pricing_type: "free" | "freemium" | "paid";
    };
  };
}
