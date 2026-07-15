-- Excluir evaluaciones ocultas (soft-deleted) de la ficha pública y del promedio

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
    AND r.deleted_at IS NULL
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_latest_review(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION recalculate_product_rating(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
  v_weighted NUMERIC;
  v_count INT;
BEGIN
  SELECT
    ROUND(
      (SUM(r.rating * tier_weight(pr.tier)) / NULLIF(SUM(tier_weight(pr.tier)), 0))::numeric,
      2
    ),
    COUNT(*)::int
  INTO v_weighted, v_count
  FROM reviews r
  JOIN profiles pr ON pr.id = r.user_id
  WHERE r.product_id = p_product_id
    AND r.deleted_at IS NULL;

  UPDATE products
  SET weighted_rating = v_weighted,
      review_count = COALESCE(v_count, 0),
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
