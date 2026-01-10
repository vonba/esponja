-- Weekly Digest Subscribers Migration
-- Run this with: psql -d esponja -f db_migration_subscribers.sql

-- Create subscribers table
CREATE TABLE IF NOT EXISTS public.digest_subscribers (
  id integer NOT NULL GENERATED ALWAYS AS IDENTITY (
    INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1
  ),
  email character varying(255) COLLATE pg_catalog."default" NOT NULL,
  subscribed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  unsubscribe_token uuid NOT NULL DEFAULT uuid_generate_v4(),
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT digest_subscribers_pkey PRIMARY KEY (id),
  CONSTRAINT digest_subscribers_email_unique UNIQUE (email)
) TABLESPACE pg_default;

ALTER TABLE public.digest_subscribers OWNER to auth;

-- Index for fast active subscriber lookups
CREATE INDEX IF NOT EXISTS digest_subscribers_active_index
  ON public.digest_subscribers USING btree
  (active ASC NULLS LAST)
  TABLESPACE pg_default;

-- Index for unsubscribe token lookups
CREATE INDEX IF NOT EXISTS digest_subscribers_token_index
  ON public.digest_subscribers USING btree
  (unsubscribe_token ASC NULLS LAST)
  TABLESPACE pg_default;

-- Index for email lookups
CREATE INDEX IF NOT EXISTS digest_subscribers_email_index
  ON public.digest_subscribers USING btree
  (email COLLATE pg_catalog."default" ASC NULLS LAST)
  TABLESPACE pg_default;

COMMENT ON TABLE public.digest_subscribers IS 'Subscribers to the weekly digest email';
