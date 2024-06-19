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
  slug character varying(120) COLLATE pg_catalog."default" UNIQUE NOT NULL,
  addressline1 character varying(255) COLLATE pg_catalog."default",
  addressline2 character varying(255) COLLATE pg_catalog."default",
  postcode character varying(20) COLLATE pg_catalog."default",
  city character varying(100) COLLATE pg_catalog."default",
  country character varying(100) COLLATE pg_catalog."default",
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
  user_id integer,
  venue_id integer,
  name character varying(255) COLLATE pg_catalog."default" NOT NULL,
  slug character varying(80) COLLATE pg_catalog."default" UNIQUE NOT NULL,
  start_date date NOT NULL,
  start_time time without time zone,
  end_date date,
  end_time time without time zone,
  description text COLLATE pg_catalog."default",
  ticket_link character varying(255) COLLATE pg_catalog."default",
  price_cents integer,
  image_key_large VARCHAR(255),
  image_key_small VARCHAR(255),
  hidden boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
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

-- NOTE: unused function for register, currently we are not allowing anyone to register
-- CREATE OR REPLACE FUNCTION public.register(
-- 	input json,
-- 	OUT user_session json)
--     RETURNS json
--     LANGUAGE 'plpgsql'
--     COST 100
--     VOLATILE PARALLEL UNSAFE
-- AS $BODY$
-- DECLARE
--   input_email varchar(80) := LOWER(TRIM((input->>'email')::varchar));
--   input_first_name varchar(20) := TRIM((input->>'firstName')::varchar);
--   input_last_name varchar(20) := TRIM((input->>'lastName')::varchar);
--   input_password varchar(80) := (input->>'password')::varchar;
-- BEGIN
--   PERFORM id FROM users WHERE email = input_email;
--   IF NOT FOUND THEN
--     INSERT INTO users(role, password, email, first_name, last_name)
--       VALUES('contributor', crypt(input_password, gen_salt('bf', 8)), input_email, input_first_name, input_last_name)
--       RETURNING
--         json_build_object(
--           'sessionId', create_session(users.id),
--           'user', json_build_object('id', users.id, 'role', 'contributor', 'email', input_email, 'firstName', input_first_name, 'lastName', input_last_name, 'optOut', false)
--         ) INTO user_session;
--   ELSE -- user is registering account that already exists so set sessionId and user to null so client can let them know
--   	SELECT authenticate(input) INTO user_session;
--   END IF;
-- END;
-- $BODY$;

-- ALTER FUNCTION public.register(json) OWNER TO auth;

-- NOTE: unused function, currently we are not allowing gmail sessions
-- CREATE OR REPLACE FUNCTION public.start_gmail_user_session(
-- 	input json,
-- 	OUT user_session json)
--     RETURNS json
--     LANGUAGE 'plpgsql'
--     COST 100
--     VOLATILE PARALLEL UNSAFE
-- AS $BODY$
-- DECLARE
--   input_email varchar(80) := LOWER(TRIM((input->>'email')::varchar));
--   input_first_name varchar(20) := TRIM((input->>'firstName')::varchar);
--   input_last_name varchar(20) := TRIM((input->>'lastName')::varchar);
-- BEGIN
--   SELECT json_build_object('id', create_session(users.id), 'user', json_build_object('id', users.id, 'role', users.role, 'email', input_email, 'firstName', users.first_name, 'lastName', users.last_name)) INTO user_session FROM users WHERE email = input_email;
--   IF NOT FOUND THEN
--     INSERT INTO users(role, email, first_name, last_name)
--       VALUES('contributor', input_email, input_first_name, input_last_name)
--       RETURNING
--         json_build_object(
--           'id', create_session(users.id),
--           'user', json_build_object('id', users.id, 'role', 'contributor', 'email', input_email, 'firstName', input_first_name, 'lastName', input_last_name)
--         ) INTO user_session;
--   END IF;
-- END;
-- $BODY$;

-- ALTER FUNCTION public.start_gmail_user_session(json) OWNER TO auth;

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
  input_slug varchar(100) := TRIM((input->>'slug')::varchar);
  input_start_date date := (input->>'startDate')::date;
  input_start_time time := (input->>'startTime')::time;
  input_end_date date := (input->>'endDate')::date;
  input_end_time time := (input->>'endTime')::time;
  input_description text := TRIM((input->>'description')::text);
  input_ticket_link varchar(255) := TRIM((input->>'ticketLink')::varchar);
  input_hidden boolean := COALESCE((input->>'hidden')::boolean, false);
  input_published boolean := COALESCE((input->>'published')::boolean, false);
  input_image_key_large varchar(255) := TRIM((input->>'imageKeyLarge')::varchar);
  input_image_key_small varchar(255) := TRIM((input->>'imageKeySmall')::varchar);
BEGIN
  IF input_id = 0 THEN
    INSERT INTO events (user_id, venue_id, name, slug, start_date, start_time, end_date, end_time, description, ticket_link, hidden, published, image_key_large, image_key_small)
    VALUES (input_user_id, input_venue_id, input_name, input_slug, input_start_date, input_start_time, input_end_date, input_end_time, input_description, input_ticket_link, input_hidden, input_published, input_image_key_large, input_image_key_small)
    RETURNING id INTO new_id;
  ELSE
    UPDATE events SET
      user_id = input_user_id,
      venue_id = input_venue_id,
      name = input_name,
      slug = input_slug,
      start_date = input_start_date,
      start_time = input_start_time,
      end_date = input_end_date,
      end_time = input_end_time,
      description = input_description,
      ticket_link = input_ticket_link,
      hidden = input_hidden,
      published = input_published,
      image_key_large = input_image_key_large,
      image_key_small = input_image_key_small
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
  input_slug varchar(100) := TRIM((input->>'slug')::varchar);
  input_addressline1 varchar(255) := TRIM((input->>'addressline1')::varchar);
  input_addressline2 varchar(255) := TRIM((input->>'addressline2')::varchar);
  input_postcode varchar(20) := TRIM((input->>'postcode')::varchar);
  input_city varchar(100) := TRIM((input->>'city')::varchar);
  input_hidden boolean := COALESCE((input->>'hidden')::boolean, false);
BEGIN
  IF input_id = 0 THEN
    INSERT INTO venues (name, slug, addressline1, addressline2, postcode, city, hidden)
    VALUES (input_name, input_slug, input_addressline1, input_addressline2, input_postcode, input_city, input_hidden)
    RETURNING id INTO new_id;
  ELSE
    UPDATE venues SET
      name = input_name,
      slug = input_slug,
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
  "name": "Teatro Lúcido",
  "slug": "teatro-lucido",
  "addressline1": "C. Dr. Enrique González Martínez 234",
  "addressline2": "Sta María la Ribera",
  "postcode": "06400",
  "city": "Ciudad de México",
  "hidden": false
}', null);
CALL upsert_venue('{
  "name": "316Centro",
  "slug": "316centro",
  "addressline1": "Fray Servando Teresa de Mier 316",
  "addressline2": "La Merced",
  "postcode": "06090",
  "city": "Ciudad de México",
  "hidden": false
}', null);
CALL upsert_venue('{
  "name": "Bajo Circuito",
  "slug": "bajo-circuito",
  "addressline1": "Bajo Puente de, Cto. Interior S/N",
  "addressline2": "Colonia Condesa",
  "postcode": "06140",
  "city": "Ciudad de México",
  "hidden": false
}', null);
CALL upsert_venue('{
  "name": "Casa del lago",
  "slug": "casa-del-lago",
  "addressline1": "Bosque de Chapultepec Primera Seccion S/N",
  "addressline2": "San Miguel Chapultepec I Secc,",
  "postcode": "11850",
  "city": "Ciudad de México",
  "hidden": false
}', null);
CALL upsert_venue('{
  "name": "Multiforo Alicia",
  "slug": "multiforo-alicia",
  "addressline1": "C. Eligio Ancona 145",
  "addressline2": "Sta María la Ribera",
  "postcode": "06400",
  "city": "Ciudad de México",
  "hidden": false
}', null);


CALL upsert_event('{
  "userId": 1,
  "venueId": 2,
  "name": "Fusce finibus dapibus ante a tristique",
  "slug": "fusce-finibus-dapibus-ante-a-tristique",
  "startDate": "2024-06-16",
  "startTime": "20:00:00",
  "endDate": null,
  "endTime": "02:00:00",
  "description": "Sed congue sit amet velit nec eleifend. Aliquam sodales mollis nunc, vel faucibus neque finibus nec. Duis ac mi sit amet mi fermentum rutrum scelerisque sit amet urna. Proin ac felis ex. Proin lacus nisl, consequat ac sollicitudin vitae, convallis sit amet lacus. Fusce finibus dapibus ante a tristique. Sed volutpat ultrices risus, efficitur auctor tortor fermentum vitae. Ut ultrices lorem nisl. Nunc a purus nisi. Integer tempor nibh vel aliquet sollicitudin. Aenean at tristique mauris. Aliquam lectus turpis, tincidunt id leo vitae, dapibus tempor sapien. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Curabitur finibus lacinia enim vel cursus. Aliquam sit amet nunc risus.",
  "ticketLink": "http://example.com/in-blandit-dolor-aliquam-quis?abc=123",
  "imageKeyLarge": "event-1-1718256781535.jpg",
  "imageKeySmall": "event-1-1718256784343.jpg",
  "hidden": false,
  "published": true
}', null);
CALL upsert_event('{
  "userId": 1,
  "venueId": 3,
  "name": "In ultricies",
  "slug": "in-ultricies",
  "startDate": "2024-06-17",
  "startTime": "21:00:00",
  "endDate": null,
  "endTime": "01:00:00",
  "description": "Quisque at erat vitae magna placerat tincidunt in in dolor. Morbi scelerisque elit at odio ultrices lacinia. Donec iaculis nec ligula ac vehicula. In ultricies in turpis nec elementum. Vivamus quis laoreet tellus, in sodales nulla. Fusce ullamcorper turpis in ligula sodales, eu tincidunt justo bibendum. Vivamus sagittis lorem quam, a vestibulum sem accumsan id. Nulla dictum pellentesque accumsan. Suspendisse malesuada sem eu lorem condimentum, quis accumsan ante fermentum. In non odio non sem rhoncus ultricies. In ac pellentesque nunc. Aenean blandit egestas vestibulum. Integer nec pharetra risus",
  "ticketLink": "",
  "imageKeyLarge": "event-3-1718327102820.jpg",
  "imageKeySmall": "event-3-1718327104329.jpg",
  "hidden": false,
  "published": true
}', null);
CALL upsert_event('{
  "userId": 1,
  "venueId": 1,
  "name": "Etiam eleifend efficitur elit",
  "slug": "etiam-eleifend-efficitur-elit",
  "startDate": "2024-06-20",
  "startTime": "20:00:00",
  "endDate": null,
  "endTime": "02:00:00",
  "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum tellus leo, vehicula sed porttitor id, imperdiet ut dolor. Nulla at sem imperdiet, congue dui in, ultricies dolor. Etiam eu gravida purus. Etiam quis condimentum leo. Vivamus cursus erat sapien, in blandit dolor aliquam quis. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. In vulputate, ante vel ullamcorper egestas, tellus est semper elit, non molestie dui nibh sit amet eros.",
  "ticketLink": "http://example.com/in-blandit-dolor-aliquam-quis?abc=123",
  "imageKeyLarge": "event-1-1718256781535.jpg",
  "imageKeySmall": "event-1-1718256784343.jpg",
  "hidden": false,
  "published": true
}', null);
CALL upsert_event('{
  "userId": 1,
  "venueId": 2,
  "name": "Nulla dictum",
  "slug": "nulla-dictum",
  "startDate": "2024-06-21",
  "startTime": "21:00:00",
  "endDate": null,
  "endTime": "01:00:00",
  "description": "Quisque at erat vitae magna placerat tincidunt in in dolor. Morbi scelerisque elit at odio ultrices lacinia. Donec iaculis nec ligula ac vehicula. In ultricies in turpis nec elementum. Vivamus quis laoreet tellus, in sodales nulla. Fusce ullamcorper turpis in ligula sodales, eu tincidunt justo bibendum. Vivamus sagittis lorem quam, a vestibulum sem accumsan id. Nulla dictum pellentesque accumsan. Suspendisse malesuada sem eu lorem condimentum, quis accumsan ante fermentum. In non odio non sem rhoncus ultricies. In ac pellentesque nunc. Aenean blandit egestas vestibulum. Integer nec pharetra risus",
  "ticketLink": "",
  "imageKeyLarge": "event-3-1718327102820.jpg",
  "imageKeySmall": "event-3-1718327104329.jpg",
  "hidden": false,
  "published": true
}', null);
CALL upsert_event('{
  "userId": 1,
  "venueId": 3,
  "name": "Phasellus iaculis elit enim vel pretium urna pretium",
  "slug": "phasellus-iaculis-elit-enim-vel-pretium-urna-pretium",
  "startDate": "2024-06-22",
  "startTime": "20:00:00",
  "endDate": null,
  "endTime": "02:00:00",
  "description": "Curabitur luctus, lacus ut congue aliquet, sem leo tempus dolor, quis rhoncus ligula ipsum in sem. Maecenas maximus elit a tortor luctus, ut facilisis turpis blandit. Suspendisse potenti. Duis aliquam euismod nisl, non mattis arcu. Integer nec erat quis mauris porttitor fermentum eget eleifend nibh. Phasellus suscipit massa non auctor auctor. Proin tempor urna aliquam dictum volutpat. Phasellus iaculis elit enim, vel pretium urna pretium ac. Nunc elementum magna eget laoreet vehicula. Suspendisse lectus eros, rutrum non vulputate non, sagittis id turpis. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Integer dictum augue fermentum nisl iaculis convallis. Maecenas maximus sapien ut ipsum finibus varius.",
  "ticketLink": "http://example.com/in-blandit-dolor-aliquam-quis?abc=123",
  "imageKeyLarge": "event-1-1718256781535.jpg",
  "imageKeySmall": "event-1-1718256784343.jpg",
  "hidden": false,
  "published": true
}', null);
CALL upsert_event('{
  "userId": 1,
  "venueId": 4,
  "name": "Suspendisse malesuada sem",
  "slug": "suspendisse-malesuada-sem",
  "startDate": "2024-06-23",
  "startTime": "21:00:00",
  "endDate": null,
  "endTime": "01:00:00",
  "description": "Quisque at erat vitae magna placerat tincidunt in in dolor. Morbi scelerisque elit at odio ultrices lacinia. Donec iaculis nec ligula ac vehicula. In ultricies in turpis nec elementum. Vivamus quis laoreet tellus, in sodales nulla. Fusce ullamcorper turpis in ligula sodales, eu tincidunt justo bibendum. Vivamus sagittis lorem quam, a vestibulum sem accumsan id. Nulla dictum pellentesque accumsan. Suspendisse malesuada sem eu lorem condimentum, quis accumsan ante fermentum. In non odio non sem rhoncus ultricies. In ac pellentesque nunc. Aenean blandit egestas vestibulum. Integer nec pharetra risus",
  "ticketLink": "",
  "imageKeyLarge": "event-3-1718327102820.jpg",
  "imageKeySmall": "event-3-1718327104329.jpg",
  "hidden": false,
  "published": true
}', null);
CALL upsert_event('{
  "userId": 1,
  "venueId": 5,
  "name": "Fusce ullamcorper turpis in ligula sodales",
  "slug": "fusce-ullamcorper-turpis-in-ligula-sodales",
  "startDate": "2024-06-24",
  "startTime": "16:00:00",
  "endDate": "2024-06-25",
  "endTime": "22:00:00",
  "description": "Quisque at erat vitae magna placerat tincidunt in in dolor. Morbi scelerisque elit at odio ultrices lacinia. Donec iaculis nec ligula ac vehicula. In ultricies in turpis nec elementum. Vivamus quis laoreet tellus, in sodales nulla. Fusce ullamcorper turpis in ligula sodales, eu tincidunt justo bibendum. Vivamus sagittis lorem quam, a vestibulum sem accumsan id. Nulla dictum pellentesque accumsan. Suspendisse malesuada sem eu lorem condimentum, quis accumsan ante fermentum. In non odio non sem rhoncus ultricies. In ac pellentesque nunc. Aenean blandit egestas vestibulum. Integer nec pharetra risus.",
  "ticketLink": "http://example.com/in-blandit-dolor-aliquam-quis?abc=123",
  "imageKeyLarge": "event-1-1718256781535.jpg",
  "imageKeySmall": "event-1-1718256784343.jpg",
  "hidden": false,
  "published": true
}', null);
CALL upsert_event('{
  "userId": 1,
  "venueId": 5,
  "name": "Praesent fermentum",
  "slug": "praesent-fermentum",
  "startDate": "2024-06-28",
  "startTime": "20:00:00",
  "endDate": null,
  "endTime": "01:00:00",
  "description": "Sed congue sit amet velit nec eleifend. Aliquam sodales mollis nunc, vel faucibus neque finibus nec. Duis ac mi sit amet mi fermentum rutrum scelerisque sit amet urna. Proin ac felis ex. Proin lacus nisl, consequat ac sollicitudin vitae, convallis sit amet lacus. Fusce finibus dapibus ante a tristique. Sed volutpat ultrices risus, efficitur auctor tortor fermentum vitae. Ut ultrices lorem nisl. Nunc a purus nisi. Integer tempor nibh vel aliquet sollicitudin. Aenean at tristique mauris. Aliquam lectus turpis, tincidunt id leo vitae, dapibus tempor sapien. Vestibulum ante ipsum primis in faucibus orciluctus et ultrices posuere cubilia curae; Curabitur finibus lacinia enim vel cursus. Aliquam sit amet nunc risus.",
  "ticketLink": "http://example.com/in-blandit-dolor-aliquam-quis?abc=123",
  "imageKeyLarge": "event-1-1718256781535.jpg",
  "imageKeySmall": "event-1-1718256784343.jpg",
  "hidden": false,
  "published": true
}', null);

