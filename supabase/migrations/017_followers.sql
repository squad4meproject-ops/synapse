-- Table followers
CREATE TABLE followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Ne pas se suivre soi-même
ALTER TABLE followers ADD CONSTRAINT followers_no_self_follow CHECK (follower_id != following_id);

-- Index
CREATE INDEX idx_followers_follower ON followers (follower_id);
CREATE INDEX idx_followers_following ON followers (following_id);

-- RLS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view followers"
  ON followers FOR SELECT USING (true);

CREATE POLICY "Service role can insert followers"
  ON followers FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can delete followers"
  ON followers FOR DELETE USING (true);

GRANT SELECT ON followers TO authenticated;
GRANT ALL ON followers TO service_role;
