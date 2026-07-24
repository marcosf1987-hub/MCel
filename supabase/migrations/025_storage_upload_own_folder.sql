-- Forzar que uploads vayan bajo carpeta del propio usuario

DROP POLICY IF EXISTS "product_images_storage_auth_upload" ON storage.objects;
CREATE POLICY "product_images_storage_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "product_images_storage_own_update" ON storage.objects;
CREATE POLICY "product_images_storage_own_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "avatars_storage_auth_upload" ON storage.objects;
CREATE POLICY "avatars_storage_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
