-- Eliminar fotos propias (evaluación / producto)

DROP POLICY IF EXISTS "product_images_own_delete" ON product_images;

CREATE POLICY "product_images_own_delete"
  ON product_images
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "product_images_storage_own_delete" ON storage.objects;

CREATE POLICY "product_images_storage_own_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
