#!/bin/bash
set -e

psql -d postgres -f db_create.sql

for f in migrations/*.sql; do
  echo "Running migration: $f"
  psql -d esponja -f "$f"
done
