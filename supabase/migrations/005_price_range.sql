-- Rango de precio ($ $$ $$$ $$$$) en lugar de monto en ARS

CREATE TYPE price_range AS ENUM ('1', '2', '3', '4');

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS price_range price_range;

UPDATE reviews
SET price_range = CASE
  WHEN price IS NULL THEN '2'::price_range
  WHEN price < 1500 THEN '1'::price_range
  WHEN price < 4000 THEN '2'::price_range
  WHEN price < 10000 THEN '3'::price_range
  ELSE '4'::price_range
END
WHERE price_range IS NULL;

ALTER TABLE reviews ALTER COLUMN price_range SET NOT NULL;
ALTER TABLE reviews ALTER COLUMN price_range SET DEFAULT '2';

ALTER TABLE reviews DROP COLUMN IF EXISTS price;

CREATE OR REPLACE FUNCTION get_latest_review(p_product_id UUID)
RETURNS TABLE (
  id UUID,
  rating INT,
  opinion TEXT,
  general_description TEXT,
  taste TEXT,
  price_range price_range,
  gluten_certification gluten_certification,
  created_at TIMESTAMPTZ,
  display_name TEXT,
  tier user_tier
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.rating, r.opinion, r.general_description, r.taste, r.price_range,
         r.gluten_certification, r.created_at, p.display_name, p.tier
  FROM reviews r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.product_id = p_product_id
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_latest_review(UUID) TO anon, authenticated;
