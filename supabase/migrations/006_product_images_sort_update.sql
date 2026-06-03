-- Permitir reordenar sort_order al subir fotos de comunidad (portada en 0)
DROP POLICY IF EXISTS "product_images_auth_update" ON product_images;

CREATE POLICY "product_images_auth_update"
  ON product_images
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
