-- Core schema: PostGIS, domain enums, profiles, establishments, auth bootstrap.
-- Matches context/DATA_ARCHITECTURE.md (ticket 03).

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE bidet_type AS ENUM (
  'none',
  'manual_spray',
  'high_pressure',
  'built_in'
);

CREATE TYPE access_cost AS ENUM ('free', 'paid');

CREATE TYPE access_scope AS ENUM ('public', 'needs_patronage');

CREATE TYPE restroom_status AS ENUM (
  'active',
  'disputed',
  'closed',
  'archived'
);

CREATE TYPE report_reason AS ENUM (
  'doesnt_exist',
  'wrong_location',
  'permanently_closed',
  'inappropriate_photos'
);

CREATE TYPE report_status AS ENUM ('open', 'reviewed', 'dismissed');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_is_admin_idx ON public.profiles (is_admin) WHERE is_admin = true;

CREATE TABLE public.establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id text NOT NULL,
  name text NOT NULL,
  formatted_address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  location geography(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (place_id)
);

CREATE INDEX establishments_location_gix ON public.establishments USING GIST (location);

-- Bootstrap profiles from Google OAuth metadata on first sign-in.
-- Attribution format: given name + last initial (e.g. "Maria S.").
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  given_name text;
  family_name text;
  full_name text;
  display_name text;
  avatar text;
BEGIN
  given_name := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'given_name'), '');
  family_name := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'family_name'), '');
  full_name := NULLIF(
    TRIM(
      COALESCE(
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'name',
        ''
      )
    ),
    ''
  );
  avatar := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture'
  );

  IF given_name IS NULL AND full_name IS NOT NULL THEN
    given_name := SPLIT_PART(full_name, ' ', 1);
  END IF;

  IF family_name IS NULL AND full_name IS NOT NULL AND POSITION(' ' IN full_name) > 0 THEN
    family_name := REGEXP_REPLACE(full_name, '^.*\s+(\S+)$', '\1');
  END IF;

  IF given_name IS NOT NULL AND family_name IS NOT NULL THEN
    display_name := given_name || ' ' || LEFT(family_name, 1) || '.';
  ELSIF given_name IS NOT NULL THEN
    display_name := given_name;
  ELSIF full_name IS NOT NULL THEN
    display_name := full_name;
  ELSE
    display_name := 'User';
  END IF;

  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, display_name, avatar);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
