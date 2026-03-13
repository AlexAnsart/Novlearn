-- Migration 014: Add get_public_profile RPC function
-- Returns only public fields of a user profile, preventing exposure of
-- sensitive data (email, birth_date, role) to other users.

CREATE OR REPLACE FUNCTION get_public_profile(target_user_id uuid)
RETURNS TABLE (
  id         uuid,
  first_name text,
  last_name  text,
  crown_count integer,
  star_count  integer,
  created_at  timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    id,
    first_name,
    last_name,
    crown_count,
    star_count,
    created_at
  FROM profiles
  WHERE id = target_user_id;
$$;

-- Only allow authenticated users to call this function
REVOKE ALL ON FUNCTION get_public_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_profile(uuid) TO authenticated;
