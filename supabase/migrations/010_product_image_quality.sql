-- Ranking de calidad estética de fotos de producto (Fase IA)

CREATE TYPE image_source AS ENUM ('community', 'off', 'official');
CREATE TYPE image_quality_status AS ENUM ('pending', 'scored', 'needs_review', 'manual');

ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS image_source image_source,
  ADD COLUMN IF NOT EXISTS quality_score SMALLINT CHECK (quality_score >= 0 AND quality_score <= 100),
  ADD COLUMN IF NOT EXISTS quality_details JSONB,
  ADD COLUMN IF NOT EXISTS quality_status image_quality_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scored_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_product_images_rank_pending
  ON product_images (product_id, quality_status)
  WHERE quality_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_product_images_visible_sort
  ON product_images (product_id, sort_order)
  WHERE is_hidden = FALSE;

-- Inferir origen en filas existentes
UPDATE product_images SET image_source = CASE
  WHEN is_official THEN 'official'::image_source
  WHEN user_id IS NOT NULL THEN 'community'::image_source
  WHEN url ~* 'openfoodfacts' THEN 'off'::image_source
  ELSE 'community'::image_source
END
WHERE image_source IS NULL;

ALTER TABLE product_images
  ALTER COLUMN image_source SET NOT NULL,
  ALTER COLUMN image_source SET DEFAULT 'community';
