-- Security fixes (November 2026)
-- Run once against each database, e.g.:
--   psql -d esponja -f migrations/db_migration_security_fixes.sql
-- For Supabase, use the Session pooler connection string, as scripts/migrate-to-supabase.sh does,
-- or paste the whole file into the dashboard's SQL editor (it runs as postgres, which owns these
-- functions, and will ask you to confirm the DROP).
-- Deploy the app first: it no longer calls register(), but the old version still would.

BEGIN;

-- Blocked users lose their sessions at once. Before this, blocking only stopped the next login
-- (authenticate() checks blocked) and an existing session kept working until it expired.
CREATE OR REPLACE FUNCTION public.get_session(input_session_id uuid)
  RETURNS json
  LANGUAGE sql
  -- CREATE OR REPLACE resets a function's settings, so restate the search path that
  -- scripts/migrate-to-supabase.sh gives every function on Supabase (a schema that doesn't
  -- exist, as locally, is simply skipped)
  SET search_path = public, extensions
AS $BODY$
SELECT json_build_object(
  'id', sessions.user_id,
  'role', users.role,
  'email', users.email,
  'firstName', users.first_name,
  'lastName', users.last_name,
  'expires', sessions.expires
) AS user
FROM sessions
  INNER JOIN users ON sessions.user_id = users.id
WHERE sessions.id = input_session_id AND expires > CURRENT_TIMESTAMP AND users.blocked = false LIMIT 1;
$BODY$;

-- The public sign-up behind /auth/register is gone. Admins create users with upsert_user
-- (POST /api/v1/user).
DROP FUNCTION IF EXISTS public.register(json);

COMMIT;
