-- Domain tables: restrooms, photos, verifies, reviews, reports + RLS + aggregate triggers.
-- Matches context/DATA_ARCHITECTURE.md (ticket 04).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_admin = true
  );
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.restrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments (id),
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  floor_area text,
  restroom_label text,
  bidet_type bidet_type NOT NULL DEFAULT 'none',
  has_tissue boolean NOT NULL DEFAULT false,
  has_soap boolean NOT NULL DEFAULT false,
  has_hand_drying boolean NOT NULL DEFAULT false,
  access_cost access_cost NOT NULL,
  access_scope access_scope NOT NULL,
  status restroom_status NOT NULL DEFAULT 'active',
  verify_count integer NOT NULL DEFAULT 0,
  rating_avg numeric(2, 1),
  rating_count integer NOT NULL DEFAULT 0,
  merged_into_id uuid REFERENCES public.restrooms (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX restrooms_establishment_id_idx ON public.restrooms (establishment_id);
CREATE INDEX restrooms_status_idx ON public.restrooms (status);
CREATE INDEX restrooms_active_idx ON public.restrooms (establishment_id) WHERE status = 'active';
CREATE INDEX restrooms_created_by_idx ON public.restrooms (created_by);

CREATE TABLE public.restroom_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restroom_id uuid NOT NULL REFERENCES public.restrooms (id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles (id),
  storage_path text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX restroom_photos_restroom_id_idx
  ON public.restroom_photos (restroom_id)
  WHERE removed_at IS NULL;

CREATE TABLE public.verifies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restroom_id uuid NOT NULL REFERENCES public.restrooms (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restroom_id, user_id)
);

CREATE INDEX verifies_restroom_id_idx ON public.verifies (restroom_id);
CREATE INDEX verifies_user_id_idx ON public.verifies (user_id);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restroom_id uuid NOT NULL REFERENCES public.restrooms (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id),
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  cleanliness_ok boolean,
  amenities_ok boolean,
  access_ok boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restroom_id, user_id)
);

CREATE INDEX reviews_restroom_id_created_at_idx
  ON public.reviews (restroom_id, created_at DESC);
CREATE INDEX reviews_user_id_idx ON public.reviews (user_id);

CREATE TABLE public.review_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX review_photos_review_id_idx
  ON public.review_photos (review_id)
  WHERE removed_at IS NULL;

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restroom_id uuid NOT NULL REFERENCES public.restrooms (id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles (id),
  reason report_reason NOT NULL,
  details text,
  status report_status NOT NULL DEFAULT 'open',
  reviewed_by uuid REFERENCES public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reports_open_queue_idx
  ON public.reports (created_at)
  WHERE status = 'open';
CREATE INDEX reports_restroom_id_idx ON public.reports (restroom_id);

CREATE OR REPLACE FUNCTION public.restroom_has_other_user_activity(
  p_restroom_id uuid,
  p_creator_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.verifies v
      WHERE v.restroom_id = p_restroom_id
        AND (p_creator_id IS NULL OR v.user_id <> p_creator_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.reviews r
      WHERE r.restroom_id = p_restroom_id
        AND (p_creator_id IS NULL OR r.user_id <> p_creator_id)
    );
$$;

-- ---------------------------------------------------------------------------
-- Aggregate triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_verify_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.restrooms
  SET
    verify_count = verify_count + 1,
    updated_at = now()
  WHERE id = NEW.restroom_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_verify_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.restrooms
  SET
    verify_count = GREATEST(verify_count - 1, 0),
    updated_at = now()
  WHERE id = OLD.restroom_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER after_insert_verify
  AFTER INSERT ON public.verifies
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_verify_count();

CREATE TRIGGER after_delete_verify
  AFTER DELETE ON public.verifies
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_verify_count();

CREATE OR REPLACE FUNCTION public.recompute_restroom_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_restroom_id uuid;
  new_avg numeric(2, 1);
  new_count integer;
BEGIN
  target_restroom_id := COALESCE(NEW.restroom_id, OLD.restroom_id);

  SELECT
    ROUND(AVG(stars)::numeric, 1),
    COUNT(*)::integer
  INTO new_avg, new_count
  FROM public.reviews
  WHERE restroom_id = target_restroom_id;

  UPDATE public.restrooms
  SET
    rating_avg = CASE WHEN new_count = 0 THEN NULL ELSE new_avg END,
    rating_count = COALESCE(new_count, 0),
    updated_at = now()
  WHERE id = target_restroom_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER after_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.recompute_restroom_rating();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.restrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restroom_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- restrooms
CREATE POLICY restrooms_select_public_or_admin
  ON public.restrooms
  FOR SELECT
  USING (
    status IN ('active', 'disputed')
    OR public.is_admin()
  );

CREATE POLICY restrooms_insert_authenticated
  ON public.restrooms
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY restrooms_update_creator_or_admin
  ON public.restrooms
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      created_by = auth.uid()
      AND NOT public.restroom_has_other_user_activity(id, created_by)
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      created_by = auth.uid()
      AND NOT public.restroom_has_other_user_activity(id, created_by)
    )
  );

CREATE POLICY restrooms_delete_creator_or_admin
  ON public.restrooms
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      created_by = auth.uid()
      AND NOT public.restroom_has_other_user_activity(id, created_by)
    )
  );

-- restroom_photos
CREATE POLICY restroom_photos_select_public
  ON public.restroom_photos
  FOR SELECT
  USING (removed_at IS NULL OR public.is_admin());

CREATE POLICY restroom_photos_insert_own
  ON public.restroom_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY restroom_photos_update_admin
  ON public.restroom_photos
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- verifies
CREATE POLICY verifies_select_public
  ON public.verifies
  FOR SELECT
  USING (true);

CREATE POLICY verifies_insert_own
  ON public.verifies
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- reviews
CREATE POLICY reviews_select_public
  ON public.reviews
  FOR SELECT
  USING (true);

CREATE POLICY reviews_insert_own
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY reviews_update_own
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- review_photos
CREATE POLICY review_photos_select_public
  ON public.review_photos
  FOR SELECT
  USING (removed_at IS NULL OR public.is_admin());

CREATE POLICY review_photos_insert_own_review
  ON public.review_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.reviews r
      WHERE r.id = review_id
        AND r.user_id = auth.uid()
    )
  );

CREATE POLICY review_photos_update_admin
  ON public.review_photos
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- reports
CREATE POLICY reports_select_own_or_admin
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid() OR public.is_admin());

CREATE POLICY reports_insert_own
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY reports_update_admin
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
