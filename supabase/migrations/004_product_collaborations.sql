-- Productos creados cuentan como colaboración (igual que reseñas)

CREATE OR REPLACE FUNCTION on_product_insert_collaboration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    UPDATE profiles
    SET collaboration_count = collaboration_count + 1,
        tier = compute_tier(collaboration_count + 1),
        updated_at = NOW()
    WHERE id = NEW.created_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_product_insert_collaboration ON products;
CREATE TRIGGER tr_product_insert_collaboration
  AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION on_product_insert_collaboration();

-- Recalcular contadores existentes (reseñas + productos creados)
UPDATE profiles p
SET
  collaboration_count = sub.total,
  tier = compute_tier(sub.total),
  updated_at = NOW()
FROM (
  SELECT
    pr.id AS profile_id,
    COALESCE(r.cnt, 0) + COALESCE(prod.cnt, 0) AS total
  FROM profiles pr
  LEFT JOIN (
    SELECT user_id, COUNT(*)::int AS cnt FROM reviews GROUP BY user_id
  ) r ON r.user_id = pr.id
  LEFT JOIN (
    SELECT created_by, COUNT(*)::int AS cnt
    FROM products
    WHERE created_by IS NOT NULL
    GROUP BY created_by
  ) prod ON prod.created_by = pr.id
) sub
WHERE p.id = sub.profile_id;
