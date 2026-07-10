-- Precio opcional en evaluaciones (solo estrellas + opinión obligatorias)

ALTER TABLE reviews ALTER COLUMN price_range DROP NOT NULL;
ALTER TABLE reviews ALTER COLUMN price_range DROP DEFAULT;

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
