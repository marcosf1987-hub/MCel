-- Sabor en escala 1-4 (corazones) y descripción general opcional

DO $$ BEGIN
  CREATE TYPE taste_rating AS ENUM ('1', '2', '3', '4');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS taste_rating taste_rating;

ALTER TABLE reviews ALTER COLUMN general_description DROP NOT NULL;

UPDATE reviews SET general_description = NULL WHERE general_description = '';

DROP FUNCTION IF EXISTS get_latest_review(UUID);

CREATE FUNCTION get_latest_review(p_product_id UUID)
RETURNS TABLE (
  id UUID,
  rating INT,
  opinion TEXT,
  general_description TEXT,
  taste TEXT,
  taste_rating taste_rating,
  price_range price_range,
  gluten_certification gluten_certification,
  created_at TIMESTAMPTZ,
  display_name TEXT,
  tier user_tier
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.rating, r.opinion, r.general_description, r.taste, r.taste_rating,
         r.price_range, r.gluten_certification, r.created_at, p.display_name, p.tier
  FROM reviews r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.product_id = p_product_id
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_latest_review(UUID) TO anon, authenticated;
