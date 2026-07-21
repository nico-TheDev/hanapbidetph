-- Storage buckets + RLS policies for restroom and review photos (ticket 05).
-- Matches context/DATA_ARCHITECTURE.md § File / media storage.
--
-- Path conventions:
--   restroom-photos: {restroom_id}/{photo_id}.webp
--   review-photos:   {review_id}/{photo_id}.webp
--
-- Soft-delete: prefer setting removed_at on restroom_photos / review_photos
-- (admin UPDATE via existing table RLS). Service role may hard-delete storage
-- objects; authenticated clients have no storage DELETE policy.

-- ---------------------------------------------------------------------------
-- Buckets (public read preferred for v1 CDN URLs)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'restroom-photos',
    'restroom-photos',
    true,
    5242880,
    ARRAY['image/webp']
  ),
  (
    'review-photos',
    'review-photos',
    true,
    5242880,
    ARRAY['image/webp']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- storage.objects policies
-- ---------------------------------------------------------------------------

-- Public read for published photos (removed_at IS NULL). Uploader/admin can
-- still SELECT so post-upload confirmation works before the photo row exists.
CREATE POLICY restroom_photos_storage_select_published
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'restroom-photos'
    AND (
      owner = auth.uid()
      OR public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.restroom_photos rp
        WHERE rp.storage_path = name
          AND rp.removed_at IS NULL
      )
    )
  );

CREATE POLICY review_photos_storage_select_published
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'review-photos'
    AND (
      owner = auth.uid()
      OR public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.review_photos rp
        WHERE rp.storage_path = name
          AND rp.removed_at IS NULL
      )
    )
  );

-- Authenticated insert scoped to upload context:
-- path must be {entity_id}/{photo_id}.webp and caller must own that entity
-- (restroom creator / review author) or be admin.
CREATE POLICY restroom_photos_storage_insert_own_context
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'restroom-photos'
    AND name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.restrooms r
        WHERE r.id::text = (storage.foldername(name))[1]
          AND r.created_by = auth.uid()
      )
    )
  );

CREATE POLICY review_photos_storage_insert_own_context
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'review-photos'
    AND name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.reviews r
        WHERE r.id::text = (storage.foldername(name))[1]
          AND r.user_id = auth.uid()
      )
    )
  );
