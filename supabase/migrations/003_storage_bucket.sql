-- Crear bucket de imágenes (ejecutá si no existe en Storage)
-- Supabase → SQL Editor → Run

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- Políticas de storage (por si faltan)
DROP POLICY IF EXISTS "product_images_storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_images_storage_auth_upload" ON storage.objects;

CREATE POLICY "product_images_storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_storage_auth_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);
