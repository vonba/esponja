#!/bin/bash
# One-off copy of the database from Neon to Supabase (October 2026). Run from anywhere:
#
#   bash scripts/migrate-to-supabase.sh
#
# It asks for two connection strings (typing is hidden and nothing is saved):
#   Neon:     the direct connection, with "Connection pooling" off in Neon's Connect dialog
#   Supabase: the "Session pooler" URI from the Connect button in Supabase's dashboard
# Both can also be passed as NEON_URL and SUPABASE_URL environment variables.
#
# Neon is only read from. Supabase must not have any tables in its public schema yet. The copy
# runs as a single transaction that stops at the first error, so a failed run leaves nothing
# behind and can simply be repeated.

set -euo pipefail
cd "$(dirname "$0")/.."

# The local Postgres 14 tools can't read a newer Neon server, so use Homebrew's current client tools
BIN="$(brew --prefix libpq 2>/dev/null)/bin"
if [ ! -x "$BIN/pg_dump" ]; then
	echo "This needs current Postgres client tools: brew install libpq"
	exit 1
fi
PG_DUMP="$BIN/pg_dump"
PSQL="$BIN/psql"

NEON_URL="${NEON_URL:-}"
SUPABASE_URL="${SUPABASE_URL:-}"
[ -n "$NEON_URL" ] || { read -rsp "Neon connection string (direct, not pooled): " NEON_URL; echo; }
[ -n "$SUPABASE_URL" ] || { read -rsp "Supabase connection string (Session pooler): " SUPABASE_URL; echo; }

# Supabase signs its certificates with its own authority, so check them against its certificate
# (an sslmode in the URL takes precedence, which the local rehearsal of this script relies on)
CA_CERT="src/lib/server/supabase-ca.crt"
SUPABASE_SSLMODE=prefer
if [[ "$SUPABASE_URL" == *supabase.com* ]]; then
	if [ ! -f "$CA_CERT" ]; then
		echo "Missing $CA_CERT (Supabase: Database settings > SSL configuration > Download certificate)"
		exit 1
	fi
	SUPABASE_SSLMODE=verify-full
fi

neon() { "$PSQL" "$NEON_URL" -X -q -v ON_ERROR_STOP=1 "$@"; }
supabase() { PGSSLMODE="$SUPABASE_SSLMODE" PGSSLROOTCERT="$CA_CERT" "$PSQL" "$SUPABASE_URL" -X -q -v ON_ERROR_STOP=1 "$@"; }

echo "Checking both databases..."
if ! NEON_VERSION=$(neon -Atc "show server_version_num"); then
	echo "Can't reach Neon. If it has used up its free compute hours it stays suspended until the"
	echo "next billing period; switching Neon to the paid plan for the copy wakes it up."
	exit 1
fi
SUPABASE_VERSION=$(supabase -Atc "show server_version_num")
DUMP_MAJOR=$("$PG_DUMP" --version | sed -E 's/[^0-9]*([0-9]+).*/\1/')
if (( NEON_VERSION / 10000 > DUMP_MAJOR )); then
	echo "pg_dump $DUMP_MAJOR is older than Neon's Postgres $(( NEON_VERSION / 10000 )): brew upgrade libpq"
	exit 1
fi
EXISTING_TABLES=$(supabase -Atc "select count(*) from pg_tables where schemaname = 'public'")
if [ "$EXISTING_TABLES" != "0" ]; then
	echo "Supabase already has $EXISTING_TABLES table(s) in its public schema; the copy expects none."
	exit 1
fi
echo "Neon runs Postgres $(( NEON_VERSION / 10000 )), Supabase Postgres $(( SUPABASE_VERSION / 10000 ))."
echo
echo "Anything changed in the app after this point (new events, edits, logins) stays in Neon only,"
echo "so hold off on edits until DATABASE_URL points at Supabase."
read -rp "Copy now? [y/N] " ANSWER
[[ "$ANSWER" == [yY]* ]] || exit 1

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

echo "Reading from Neon..."
"$PG_DUMP" "$NEON_URL" --schema=public --no-owner --no-privileges --file="$WORK/neon.sql"

# Adapt the dump to Supabase, leaving the copied rows (COPY blocks) untouched:
# - Supabase already has a public schema
# - Neon keeps the pgcrypto and uuid-ossp functions in public, Supabase in its extensions schema
# - SET transaction_timeout only exists from Postgres 17
awk -v drop_transaction_timeout="$(( SUPABASE_VERSION < 170000 ))" '
	BEGIN { n = split("uuid_generate_v1 uuid_generate_v1mc uuid_generate_v3 uuid_generate_v4 uuid_generate_v5 crypt gen_salt digest hmac gen_random_bytes", fns, " ") }
	/^COPY / { in_copy = 1 }
	in_copy { print; if ($0 == "\\.") in_copy = 0; next }
	/^CREATE SCHEMA public;$/ || /^COMMENT ON SCHEMA public / { next }
	drop_transaction_timeout && /^SET transaction_timeout = / { next }
	{ for (i = 1; i <= n; i++) gsub("public\\." fns[i] "\\(", "extensions." fns[i] "("); print }
' "$WORK/neon.sql" > "$WORK/supabase.sql"

# Runs in the same transaction as the copy. The app connects to Postgres directly, never through
# Supabase's public API, so the API roles get no access to anything copied. Row level security is
# a second lock that doesn't affect the app, which connects as the tables' owner.
cat >> "$WORK/supabase.sql" <<'SQL'

DO $$
DECLARE
	api_role text;
	t record;
	r record;
BEGIN
	FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
		IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = api_role) THEN
			EXECUTE pg_catalog.format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', api_role);
			EXECUTE pg_catalog.format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', api_role);
			EXECUTE pg_catalog.format('REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM %I', api_role);
			EXECUTE pg_catalog.format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', api_role);
			EXECUTE pg_catalog.format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', api_role);
			EXECUTE pg_catalog.format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM %I', api_role);
		END IF;
	END LOOP;
	-- Postgres lets anyone execute a function unless told otherwise
	REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM PUBLIC;

	-- ANALYZE gives the query planner statistics for the freshly copied rows
	FOR t IN SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' LOOP
		EXECUTE pg_catalog.format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
		EXECUTE pg_catalog.format('ANALYZE public.%I', t.tablename);
	END LOOP;

	-- The app's functions call pgcrypto and uuid-ossp without a schema, so tell them where to look
	-- rather than relying on each connection's search path
	FOR r IN SELECT oid::pg_catalog.regprocedure AS routine FROM pg_catalog.pg_proc WHERE pronamespace = 'public'::pg_catalog.regnamespace LOOP
		EXECUTE pg_catalog.format('ALTER ROUTINE %s SET search_path = public, extensions', r.routine);
	END LOOP;
END $$;
SQL

echo "Writing to Supabase..."
# Supabase normally has both extensions already, in which case these do nothing
supabase -c "SET client_min_messages = warning" \
	-c "CREATE SCHEMA IF NOT EXISTS extensions" \
	-c "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions" \
	-c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions'
supabase --single-transaction -o /dev/null -f "$WORK/supabase.sql"

echo "Comparing row counts..."
COUNT_QUERY=$(neon -Atc "select string_agg(format('select %L, count(*) from public.%I', tablename, tablename), ' union all ' order by tablename) from pg_tables where schemaname = 'public'")
NEON_COUNTS=$(neon -Atc "$COUNT_QUERY")
SUPABASE_COUNTS=$(supabase -Atc "$COUNT_QUERY")
echo "$NEON_COUNTS" | sed 's/|/: /; s/^/  /'
if [ "$NEON_COUNTS" != "$SUPABASE_COUNTS" ]; then
	echo "Row counts differ between Neon and Supabase:"
	diff <(echo "$NEON_COUNTS") <(echo "$SUPABASE_COUNTS") || true
	exit 1
fi

echo "Checking the copy works..."
# A wrong password for a real user exercises pgcrypto without creating a session
LOGIN=$(supabase -Atc "select public.authenticate(json_build_object('email', (select email from public.users order by id limit 1), 'password', 'not-the-password'))->>'status'")
UNLOCKED=$(supabase -Atc "select count(*) from pg_tables where schemaname = 'public' and not rowsecurity")
if [ "$LOGIN" != "login-fail" ] || [ "$UNLOCKED" != "0" ]; then
	echo "Unexpected result (login check: $LOGIN, tables without row level security: $UNLOCKED)"
	exit 1
fi

echo
echo "Done: every table matches and logins work. Neon is unchanged."
echo "Next: set DATABASE_URL in Vercel to Supabase's Transaction pooler URI (port 6543) and redeploy."
