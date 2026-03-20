-- ============================================================
-- Migration 009: Fix RLS policies for likes and bookmarks
-- Problem: auth.uid() != users.id (users.auth_id = auth.uid())
-- Solution: Use subquery to check via users.auth_id
-- ============================================================

-- Also fix the likes_count/saves_count that got inflated during testing
-- Reset counters based on actual data
UPDATE posts SET
  likes_count = (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id),
  saves_count = (SELECT COUNT(*) FROM bookmarks WHERE bookmarks.post_id = posts.id),
  comments_count = (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id);

-- ============================================================
-- Fix LIKES RLS policies
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can like" ON likes;
DROP POLICY IF EXISTS "Users can unlike" ON likes;

-- New INSERT policy: user_id must match a users row where auth_id = auth.uid()
CREATE POLICY "Users can like"
  ON likes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_id
      AND users.auth_id = auth.uid()
    )
  );

-- New DELETE policy: same check
CREATE POLICY "Users can unlike"
  ON likes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_id
      AND users.auth_id = auth.uid()
    )
  );

-- ============================================================
-- Fix BOOKMARKS RLS policies
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can create bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;

-- New SELECT policy
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_id
      AND users.auth_id = auth.uid()
    )
  );

-- New INSERT policy
CREATE POLICY "Users can create bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_id
      AND users.auth_id = auth.uid()
    )
  );

-- New DELETE policy
CREATE POLICY "Users can delete bookmarks"
  ON bookmarks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = user_id
      AND users.auth_id = auth.uid()
    )
  );
