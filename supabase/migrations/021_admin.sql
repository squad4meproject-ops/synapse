-- Add is_admin column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Set Benjamin as admin (uncomment and run manually after migration)
-- UPDATE users SET is_admin = true WHERE email = 'squad4me.project@gmail.com';
