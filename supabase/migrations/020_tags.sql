-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_posts_count ON tags(posts_count DESC);

-- Post-tags junction
CREATE TABLE IF NOT EXISTS post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, tag_id)
);
CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);

-- RLS for tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT USING (true);

CREATE POLICY "Service role can insert/update/delete tags"
  ON tags FOR ALL WITH CHECK (true);

-- RLS for post_tags
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post_tags"
  ON post_tags FOR SELECT USING (true);

CREATE POLICY "Service role can manage post_tags"
  ON post_tags FOR ALL WITH CHECK (true);

GRANT SELECT ON tags TO authenticated;
GRANT SELECT ON post_tags TO authenticated;
GRANT ALL ON tags TO service_role;
GRANT ALL ON post_tags TO service_role;
