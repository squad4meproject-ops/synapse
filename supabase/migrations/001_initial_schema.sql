-- Synapse Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null
);

-- Articles table
create table public.articles (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  author_id uuid references public.users(id) on delete set null,
  cover_image_url text,
  published_at timestamptz,
  is_published boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Article translations table
create table public.article_translations (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references public.articles(id) on delete cascade not null,
  locale text not null check (locale in ('en', 'fr', 'es')),
  title text not null,
  excerpt text,
  content text not null,
  meta_title text,
  meta_description text,
  unique (article_id, locale)
);

-- AI Tools table
create table public.ai_tools (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text not null,
  logo_url text,
  website_url text not null,
  category text not null,
  pricing text not null default 'free' check (pricing in ('free', 'freemium', 'paid')),
  is_featured boolean default false not null,
  created_at timestamptz default now() not null
);

-- Indexes
create index idx_articles_published on public.articles(published_at desc) where is_published = true;
create index idx_articles_slug on public.articles(slug);
create index idx_article_translations_locale on public.article_translations(article_id, locale);
create index idx_ai_tools_category on public.ai_tools(category);
create index idx_ai_tools_slug on public.ai_tools(slug);
create index idx_ai_tools_featured on public.ai_tools(is_featured) where is_featured = true;

-- Row Level Security
alter table public.users enable row level security;
alter table public.articles enable row level security;
alter table public.article_translations enable row level security;
alter table public.ai_tools enable row level security;

-- Public read policies
create policy "Public read access" on public.users for select using (true);
create policy "Public read access" on public.articles for select using (is_published = true);
create policy "Public read access" on public.article_translations for select using (true);
create policy "Public read access" on public.ai_tools for select using (true);
