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
          is_premium: boolean;
          is_admin: boolean;
          preferences: Json;
          xp: number;
          level: number;
          level_title: string | null;
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
          is_premium?: boolean;
          is_admin?: boolean;
          preferences?: Json;
          xp?: number;
          level?: number;
          level_title?: string | null;
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
          is_premium?: boolean;
          is_admin?: boolean;
          preferences?: Json;
          xp?: number;
          level?: number;
          level_title?: string | null;
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
      posts: {
        Row: {
          id: string;
          author_id: string;
          category: string;
          content: string;
          prompt_content: string | null;
          link_url: string | null;
          link_preview: Json | null;
          tool_id: string | null;
          locale: string;
          likes_count: number;
          comments_count: number;
          saves_count: number;
          is_pinned: boolean;
          is_sponsored: boolean;
          sponsor_label: string | null;
          sponsor_url: string | null;
          sponsored_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          category: string;
          content: string;
          prompt_content?: string | null;
          link_url?: string | null;
          link_preview?: Json | null;
          tool_id?: string | null;
          locale?: string;
          likes_count?: number;
          comments_count?: number;
          saves_count?: number;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          category?: string;
          content?: string;
          prompt_content?: string | null;
          link_url?: string | null;
          link_preview?: Json | null;
          tool_id?: string | null;
          locale?: string;
          likes_count?: number;
          comments_count?: number;
          saves_count?: number;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_images: {
        Row: {
          id: string;
          post_id: string;
          image_url: string;
          position: number;
          alt_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          image_url: string;
          position?: number;
          alt_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          image_url?: string;
          position?: number;
          alt_text?: string | null;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          parent_id: string | null;
          content: string;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          parent_id?: string | null;
          content: string;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          parent_id?: string | null;
          content?: string;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          comment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          posts_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          posts_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          posts_count?: number;
          created_at?: string;
        };
      };
      post_tags: {
        Row: {
          id: string;
          post_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
      tool_translations: {
        Row: {
          id: string;
          tool_id: string;
          locale: string;
          name: string;
          description: string;
        };
        Insert: {
          id?: string;
          tool_id: string;
          locale: string;
          name: string;
          description: string;
        };
        Update: {
          id?: string;
          tool_id?: string;
          locale?: string;
          name?: string;
          description?: string;
        };
      };
      spaces: {
        Row: {
          id: string;
          slug: string;
          name_en: string;
          name_fr: string;
          name_es: string;
          description_en: string | null;
          description_fr: string | null;
          description_es: string | null;
          icon: string;
          color: string;
          cover_image_url: string | null;
          members_count: number;
          posts_count: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_en: string;
          name_fr: string;
          name_es: string;
          description_en?: string | null;
          description_fr?: string | null;
          description_es?: string | null;
          icon?: string;
          color?: string;
          cover_image_url?: string | null;
          members_count?: number;
          posts_count?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name_en?: string;
          name_fr?: string;
          name_es?: string;
          description_en?: string | null;
          description_fr?: string | null;
          description_es?: string | null;
          icon?: string;
          color?: string;
          cover_image_url?: string | null;
          members_count?: number;
          posts_count?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      space_members: {
        Row: {
          id: string;
          space_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          space_id?: string;
          user_id?: string;
          joined_at?: string;
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

// ============================================================
// Community Feed Types
// ============================================================

export type PostCategory = 'creation' | 'prompt' | 'question' | 'discussion' | 'tool_review';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  posts_count: number;
  created_at: string;
}

export interface PostTag {
  id: string;
  post_id: string;
  tag_id: string;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  category: PostCategory;
  content: string;
  prompt_content: string | null;
  link_url: string | null;
  link_preview: {
    title?: string;
    description?: string;
    image?: string;
  } | null;
  tool_id: string | null;
  locale: string;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  is_pinned: boolean;
  is_sponsored: boolean;
  sponsor_label: string | null;
  sponsor_url: string | null;
  sponsored_until: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: User;
  images?: PostImage[];
  tool?: AITool;
  tags?: Tag[];
  // Current user state (computed in queries)
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface PostImage {
  id: string;
  post_id: string;
  image_url: string;
  position: number;
  alt_text: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: User;
  replies?: Comment[];
  // Current user state
  is_liked?: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

type User = Database["public"]["Tables"]["users"]["Row"];
type AITool = Database["public"]["Tables"]["ai_tools"]["Row"];
