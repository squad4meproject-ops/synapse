-- =============================================
-- Fix: Add missing GRANT permissions on spaces tables
-- =============================================

-- Spaces table: allow read for all, full access for service_role
GRANT SELECT ON spaces TO anon;
GRANT SELECT ON spaces TO authenticated;
GRANT ALL ON spaces TO service_role;

-- Space members table: allow read + insert/delete for authenticated
GRANT SELECT ON space_members TO anon;
GRANT SELECT, INSERT, DELETE ON space_members TO authenticated;
GRANT ALL ON space_members TO service_role;
