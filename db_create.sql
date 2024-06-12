-- Invoke this script via
-- $ psql -d postgres -f db_create.sql

-- Create role if not already there
DO
$do$
BEGIN
  IF NOT EXISTS (
    SELECT -- SELECT list can stay empty for this
    FROM   pg_catalog.pg_roles
    WHERE  rolname = 'auth') THEN

    CREATE ROLE auth;
  END IF;
END
$do$;

-- Forcefully disconnect anyone
SELECT pid, pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'esponja' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS esponja;

CREATE DATABASE esponja
  WITH 
  OWNER = auth
  ENCODING = 'UTF8'
  TABLESPACE = pg_default
  CONNECTION LIMIT = -1;

COMMENT ON DATABASE esponja IS 'Esponja';

-- Connect to auth database
\connect esponja

-- Required for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Required to generate UUIDs for sessions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Using hard-coded roles (often this would be a table)
CREATE TYPE public.roles AS ENUM
  ('contributor', 'editor', 'admin');

ALTER TYPE public.roles OWNER TO auth;

-- Users table
DROP TABLE IF EXISTS public.users;
CREATE TABLE public.users (
  id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
  role roles NOT NULL DEFAULT 'contributor'::roles,
  email character varying(80) COLLATE pg_catalog."default" NOT NULL,
  password character varying(80) COLLATE pg_catalog."default",
  first_name character varying(20) COLLATE pg_catalog."default" NOT NULL,
  last_name character varying(20) COLLATE pg_catalog."default" NOT NULL,
  hidden boolean NOT NULL DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_unique UNIQUE (email)
    deferrable initially immediate
) TABLESPACE pg_default;

ALTER TABLE public.users OWNER to auth;

CREATE INDEX users_first_name_index
  ON public.users USING btree
  (first_name COLLATE pg_catalog."default" ASC NULLS LAST)
  TABLESPACE pg_default;

CREATE INDEX users_last_name_index
  ON public.users USING btree
  (last_name COLLATE pg_catalog."default" ASC NULLS LAST)
  TABLESPACE pg_default;

CREATE INDEX users_password
  ON public.users USING btree
  (password COLLATE pg_catalog."default" ASC NULLS LAST)
  TABLESPACE pg_default;


-- Venues table
DROP TABLE IF EXISTS public.venues;
CREATE TABLE public.venues (
  id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
  name character varying(100) COLLATE pg_catalog."default" NOT NULL,
  addressline1 character varying(255) COLLATE pg_catalog."default",
  addressline2 character varying(255) COLLATE pg_catalog."default",
  postcode character varying(20) COLLATE pg_catalog."default",
  city character varying(100) COLLATE pg_catalog."default",
  hidden boolean NOT NULL DEFAULT false,
  CONSTRAINT venues_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

ALTER TABLE public.venues OWNER to auth;

CREATE INDEX venues_name_index
  ON public.venues USING btree
  (name COLLATE pg_catalog."default" ASC NULLS LAST)
  TABLESPACE pg_default;

-- Events table
DROP TABLE IF EXISTS public.events;
CREATE TABLE public.events (
  id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
  user_id integer NOT NULL,
  venue_id integer,
  name character varying(100) COLLATE pg_catalog."default" NOT NULL,
  start_date date NOT NULL,
  start_time time without time zone,
  end_date date,
  end_time time without time zone,
  description text COLLATE pg_catalog."default",
  ticket_link character varying(255) COLLATE pg_catalog."default",
  price_cents integer,
  image_url VARCHAR(255),
  hidden boolean NOT NULL DEFAULT false,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.users (id) MATCH SIMPLE
      ON UPDATE NO ACTION
      ON DELETE NO ACTION,
  CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id)
      REFERENCES public.venues (id) MATCH SIMPLE
      ON UPDATE NO ACTION
      ON DELETE NO ACTION
) TABLESPACE pg_default;

ALTER TABLE public.events OWNER to auth;

CREATE INDEX events_name_index
  ON public.events USING btree
  (name COLLATE pg_catalog."default" ASC NULLS LAST)
  TABLESPACE pg_default;

CREATE INDEX events_start_date_index
  ON public.events USING btree
  (start_date ASC NULLS LAST)
  TABLESPACE pg_default;

-- Sessions table

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id integer NOT NULL,
  expires timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '02:00:00'::interval),
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_user_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
    NOT VALID
) TABLESPACE pg_default;

ALTER TABLE public.sessions OWNER to auth;

CREATE OR REPLACE FUNCTION public.authenticate(
	input json,
	OUT response json)
    RETURNS json
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
  input_email varchar(80) := LOWER(TRIM((input->>'email')::varchar));
  input_password varchar(80) := (input->>'password')::varchar;
BEGIN
  IF input_email IS NULL OR input_password IS NULL THEN
    response := json_build_object('statusCode', 400, 'status', 'Please provide an email address and password to authenticate.', 'user', NULL);
	RETURN;
  END IF;

  WITH user_authenticated AS (
    SELECT users.id, role, first_name, last_name
    FROM users
    WHERE email = input_email AND password = crypt(input_password, password) LIMIT 1
  )
  SELECT json_build_object(
	'statusCode', CASE WHEN (SELECT COUNT(*) FROM user_authenticated) > 0 THEN 200 ELSE 401 END,
	'status', CASE WHEN (SELECT COUNT(*) FROM user_authenticated) > 0
	  THEN 'Login successful.'
	  ELSE 'Invalid username/password combination.'
	END,
	'user', CASE WHEN (SELECT COUNT(*) FROM user_authenticated) > 0
	  THEN (SELECT json_build_object(
		  'id', user_authenticated.id,
		  'role', user_authenticated.role,
		  'email', input_email,
		  'firstName', user_authenticated.first_name,
		  'lastName', user_authenticated.last_name)
		 FROM user_authenticated)
	  ELSE NULL
	  END,
	'sessionId', (SELECT create_session(user_authenticated.id) FROM user_authenticated)
  ) INTO response;
END;
$BODY$;

ALTER FUNCTION public.authenticate(json) OWNER TO auth;

CREATE OR REPLACE FUNCTION public.create_session(
	input_user_id integer)
    RETURNS uuid
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DELETE FROM sessions WHERE user_id = input_user_id;
INSERT INTO sessions(user_id) VALUES (input_user_id) RETURNING sessions.id;
$BODY$;

ALTER FUNCTION public.create_session(integer) OWNER TO auth;

CREATE OR REPLACE FUNCTION public.get_session(input_session_id uuid)
  RETURNS json
  LANGUAGE 'sql'
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
WHERE sessions.id = input_session_id AND expires > CURRENT_TIMESTAMP LIMIT 1;
$BODY$;

ALTER FUNCTION public.get_session(uuid) OWNER TO auth;

CREATE OR REPLACE FUNCTION public.register(
	input json,
	OUT user_session json)
    RETURNS json
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
  input_email varchar(80) := LOWER(TRIM((input->>'email')::varchar));
  input_first_name varchar(20) := TRIM((input->>'firstName')::varchar);
  input_last_name varchar(20) := TRIM((input->>'lastName')::varchar);
  input_password varchar(80) := (input->>'password')::varchar;
BEGIN
  PERFORM id FROM users WHERE email = input_email;
  IF NOT FOUND THEN
    INSERT INTO users(role, password, email, first_name, last_name)
      VALUES('contributor', crypt(input_password, gen_salt('bf', 8)), input_email, input_first_name, input_last_name)
      RETURNING
        json_build_object(
          'sessionId', create_session(users.id),
          'user', json_build_object('id', users.id, 'role', 'contributor', 'email', input_email, 'firstName', input_first_name, 'lastName', input_last_name, 'optOut', false)
        ) INTO user_session;
  ELSE -- user is registering account that already exists so set sessionId and user to null so client can let them know
  	SELECT authenticate(input) INTO user_session;
  END IF;
END;
$BODY$;

ALTER FUNCTION public.register(json) OWNER TO auth;

CREATE OR REPLACE FUNCTION public.start_gmail_user_session(
	input json,
	OUT user_session json)
    RETURNS json
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
  input_email varchar(80) := LOWER(TRIM((input->>'email')::varchar));
  input_first_name varchar(20) := TRIM((input->>'firstName')::varchar);
  input_last_name varchar(20) := TRIM((input->>'lastName')::varchar);
BEGIN
  SELECT json_build_object('id', create_session(users.id), 'user', json_build_object('id', users.id, 'role', users.role, 'email', input_email, 'firstName', users.first_name, 'lastName', users.last_name)) INTO user_session FROM users WHERE email = input_email;
  IF NOT FOUND THEN
    INSERT INTO users(role, email, first_name, last_name)
      VALUES('contributor', input_email, input_first_name, input_last_name)
      RETURNING
        json_build_object(
          'id', create_session(users.id),
          'user', json_build_object('id', users.id, 'role', 'contributor', 'email', input_email, 'firstName', input_first_name, 'lastName', input_last_name)
        ) INTO user_session;
  END IF;
END;
$BODY$;

ALTER FUNCTION public.start_gmail_user_session(json) OWNER TO auth;

CREATE PROCEDURE public.delete_session(input_id integer)
    LANGUAGE sql
    AS $$
DELETE FROM sessions WHERE user_id = input_id;
$$;

CREATE OR REPLACE PROCEDURE public.reset_password(IN input_id integer, IN input_password text)
  LANGUAGE plpgsql
AS $procedure$
BEGIN
  UPDATE users SET password = crypt(input_password, gen_salt('bf', 8)) WHERE id = input_id;
END;
$procedure$
;

ALTER PROCEDURE public.reset_password(integer, text) OWNER TO auth;

CREATE OR REPLACE PROCEDURE public.upsert_user(input json)
LANGUAGE plpgsql
AS $BODY$
DECLARE
  input_id integer := COALESCE((input->>'id')::integer,0);
  input_role roles := COALESCE((input->>'role')::roles, 'contributor');
  input_email varchar(80) := LOWER(TRIM((input->>'email')::varchar));
  input_password varchar(80) := COALESCE((input->>'password')::varchar, '');
  input_first_name varchar(20) := TRIM((input->>'firstName')::varchar);
  input_last_name varchar(20) := TRIM((input->>'lastName')::varchar);
  input_hidden boolean := COALESCE((input->>'hidden')::boolean, false);
BEGIN
  IF input_id = 0 THEN
    INSERT INTO users (role, email, password, first_name, last_name, hidden)
    VALUES (
	  input_role, input_email, crypt(input_password, gen_salt('bf', 8)),
	  input_first_name, input_last_name, input_hidden);
  ELSE
    UPDATE users SET
	  role = input_role,
	  email = input_email,
	  password = CASE WHEN input_password = ''
		  THEN password -- leave as is (we are updating fields other than the password)
		  ELSE crypt(input_password, gen_salt('bf', 8))
	  END,
	  first_name = input_first_name,
	  last_name = input_last_name,
    hidden = input_hidden
	WHERE id = input_id;
  END IF;
END;
$BODY$;

ALTER PROCEDURE public.upsert_user(json) OWNER TO auth;

CREATE OR REPLACE PROCEDURE public.update_user(input_id integer, input json)
LANGUAGE plpgsql
AS $BODY$
DECLARE
  input_email varchar(80) := LOWER(TRIM((input->>'email')::varchar));
  input_password varchar(80) := COALESCE((input->>'password')::varchar, '');
  input_first_name varchar(20) := TRIM((input->>'firstName')::varchar);
  input_last_name varchar(20) := TRIM((input->>'lastName')::varchar);
BEGIN
  UPDATE users SET
    email = input_email,
	password = CASE WHEN input_password = ''
      THEN password -- leave as is (we are updating fields other than the password)
	  ELSE crypt(input_password, gen_salt('bf', 8))
	END,
	first_name = input_first_name,
	last_name = input_last_name
  WHERE id = input_id;
END;
$BODY$;

ALTER PROCEDURE public.update_user(integer, json) OWNER TO auth;

CREATE OR REPLACE PROCEDURE public.upsert_event(input IN json, new_id OUT integer)
LANGUAGE plpgsql
AS $BODY$
DECLARE
  input_id integer := COALESCE((input->>'id')::integer,0);
  input_user_id integer := (input->>'userId')::integer;
  input_venue_id integer := (input->>'venueId')::integer;
  input_name varchar(100) := TRIM((input->>'name')::varchar);
  input_start_date date := (input->>'startDate')::date;
  input_start_time time := (input->>'startTime')::time;
  input_end_date date := (input->>'endDate')::date;
  input_end_time time := (input->>'endTime')::time;
  input_description text := TRIM((input->>'description')::text);
  input_ticket_link varchar(255) := TRIM((input->>'ticketLink')::varchar);
  input_hidden boolean := COALESCE((input->>'hidden')::boolean, false);
BEGIN
  IF input_id = 0 THEN
    INSERT INTO events (user_id, venue_id, name, start_date, start_time, end_date, end_time, description, ticket_link, hidden)
    VALUES (input_user_id, input_venue_id, input_name, input_start_date, input_start_time, input_end_date, input_end_time, input_description, input_ticket_link, input_hidden)
    RETURNING id INTO new_id;
  ELSE
    UPDATE events SET
      user_id = input_user_id,
      venue_id = input_venue_id,
      name = input_name,
      start_date = input_start_date,
      start_time = input_start_time,
      end_date = input_end_date,
      end_time = input_end_time,
      description = input_description,
      ticket_link = input_ticket_link,
      hidden = input_hidden
    WHERE id = input_id;
  END IF;
END;
$BODY$;

CREATE OR REPLACE PROCEDURE public.upsert_venue(input IN json, new_id OUT integer)
LANGUAGE plpgsql
AS $BODY$
DECLARE
  input_id integer := COALESCE((input->>'id')::integer,0);
  input_name varchar(100) := TRIM((input->>'name')::varchar);
  input_addressline1 varchar(255) := TRIM((input->>'addressline1')::varchar);
  input_addressline2 varchar(255) := TRIM((input->>'addressline2')::varchar);
  input_postcode varchar(20) := TRIM((input->>'postcode')::varchar);
  input_city varchar(100) := TRIM((input->>'city')::varchar);
  input_hidden boolean := COALESCE((input->>'hidden')::boolean, false);
BEGIN
  IF input_id = 0 THEN
    INSERT INTO venues (name, addressline1, addressline2, postcode, city, hidden)
    VALUES (input_name, input_addressline1, input_addressline2, input_postcode, input_city, input_hidden)
    RETURNING id INTO new_id;
  ELSE
    UPDATE venues SET
      name = input_name,
      addressline1 = input_addressline1,
      addressline2 = input_addressline2,
      postcode = input_postcode,
      city = input_city,
      hidden = input_hidden
    WHERE id = input_id;
  END IF;
END;
$BODY$;


CALL public.upsert_user('{"id":0, "role":"admin", "email":"admin@example.com", "password":"admin123", "firstName":"Simon", "lastName":"Balthazar"}'::json);
CALL public.upsert_user('{"id":0, "role":"editor", "email":"editor@example.com", "password":"editor123", "firstName":"John", "lastName":"Doe"}'::json);
CALL public.upsert_user('{"id":0, "role":"contributor", "email":"contributor@example.com", "password":"contributor123", "firstName":"Justin", "lastName":"Case"}'::json);

CALL upsert_venue('{
  "name": "Venue 1",
  "addressline1": "123 Main St",
  "addressline2": "Suite 1",
  "postcode": "12345",
  "city": "CDMX",
  "hidden": false
}', null);

CALL upsert_venue('{
  "name": "Venue 2",
  "addressline1": "456 Elm St",
  "addressline2": "Apt 2B",
  "postcode": "67890",
  "city": "CDMX",
  "hidden": false
}', null);

CALL upsert_venue('{
  "name": "Venue 3",
  "addressline1": "789 Oak St",
  "addressline2": "Floor 3",
  "postcode": "54321",
  "city": "CDMX",
  "hidden": false
}', null);

CALL upsert_venue('{
  "name": "Venue 4",
  "addressline1": "101 Pine St",
  "addressline2": "Building 4",
  "postcode": "98765",
  "city": "CDMX",
  "hidden": false
}', null);

CALL upsert_venue('{
  "name": "Venue 5",
  "addressline1": "202 Birch St",
  "addressline2": "",
  "postcode": "11223",
  "city": "CDMX",
  "hidden": false
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 1,
  "name": "Event 1",
  "startDate": "2024-06-16",
  "startTime": "10:00:00",
  "endDate": "2024-06-17",
  "endTime": "18:00:00",
  "description": "Description for Event 1",
  "ticketLink": "http://example.com/ticket1"
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 2,
  "name": "Event 2",
  "startDate": "2024-06-17",
  "startTime": "11:00:00",
  "description": "Description for Event 2",
  "ticketLink": "http://example.com/ticket2"
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 3,
  "name": "Event 3",
  "startDate": "2024-06-18",
  "startTime": "12:00:00",
  "endDate": "2024-06-18",
  "endTime": "20:00:00",
  "description": "Description for Event 3",
  "ticketLink": "http://example.com/ticket3"
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 4,
  "name": "Event 4",
  "startDate": "2024-06-19",
  "startTime": "13:00:00",
  "description": "Description for Event 4",
  "ticketLink": "http://example.com/ticket4"
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 5,
  "name": "Event 5",
  "startDate": "2024-06-20",
  "startTime": "14:00:00",
  "endDate": "2024-06-21",
  "description": "Description for Event 5",
  "ticketLink": "http://example.com/ticket5",
  "price": 120
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 1,
  "name": "Event 6",
  "startDate": "2024-06-21",
  "startTime": "15:00:00",
  "endDate": "2024-06-22",
  "endTime": "21:00:00",
  "description": "Description for Event 6",
  "ticketLink": "http://example.com/ticket6",
  "price": 200
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 2,
  "name": "Event 7",
  "startDate": "2024-06-22",
  "startTime": "16:00:00",
  "description": "Description for Event 7",
  "price": 80
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 3,
  "name": "Event 8",
  "startDate": "2024-06-23",
  "description": "Description for Event 8",
  "ticketLink": "http://example.com/ticket8",
  "price": 250
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 4,
  "name": "Event 9",
  "startDate": "2024-06-24",
  "startTime": "17:00:00",
  "endDate": "2024-06-25",
  "endTime": "22:00:00",
  "description": "Description for Event 9"
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 5,
  "name": "Event 10",
  "startDate": "2024-06-25",
  "startTime": "18:00:00",
  "endDate": "2024-06-26",
  "description": "Description for Event 10",
  "ticketLink": "http://example.com/ticket10",
  "price": 150
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 1,
  "name": "Event 11",
  "startDate": "2024-06-26",
  "description": "Description for Event 11",
  "ticketLink": "http://example.com/ticket11"
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 2,
  "name": "Event 12",
  "startDate": "2024-06-27",
  "startTime": "19:00:00",
  "endDate": "2024-06-28",
  "endTime": "23:00:00",
  "description": "Description for Event 12",
  "price": 200
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 3,
  "name": "Event 13",
  "startDate": "2024-06-28",
  "startTime": "20:00:00",
  "description": "Description for Event 13",
  "ticketLink": "http://example.com/ticket13"
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 4,
  "name": "Event 14",
  "startDate": "2024-06-29",
  "startTime": "21:00:00",
  "endDate": "2024-06-30",
  "description": "Description for Event 14"
}', null);

CALL upsert_event('{
  "userId": 1,
  "venueId": 5,
  "name": "Event 15",
  "startDate": "2024-06-30",
  "startTime": "22:00:00",
  "description": "Description for Event 15",
  "ticketLink": "http://example.com/ticket15"
}', null);

