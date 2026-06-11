-- Avatares de perfil (bucket público)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152;

DROP POLICY IF EXISTS "avatars_storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_storage_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars_storage_own_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_storage_own_delete" ON storage.objects;

CREATE POLICY "avatars_storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_storage_auth_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "avatars_storage_own_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_storage_own_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
