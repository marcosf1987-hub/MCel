-- Endurecer RLS: quitar updates abiertos de productos/imágenes
-- y funciones DEFINER necesarias para flujosos legítimos

-- 1) Recalcular rating debe poder actualizar products aunque el usuario no tenga UPDATE
CREATE OR REPLACE FUNCTION public.recalculate_product_rating(p_product_id UUID)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.recalculate_product_rating(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalculate_product_rating(UUID) TO authenticated, service_role;

-- 2) Desplazar sort_order al subir foto de comunidad (sin UPDATE abierto)
CREATE OR REPLACE FUNCTION public.bump_product_images_sort(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NULL AND coalesce(auth.role(), 'anon') <> 'service_role' THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE product_images
  SET sort_order = sort_order + 1
  WHERE product_id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.bump_product_images_sort(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bump_product_images_sort(UUID) TO authenticated, service_role;

-- 3) Escribir ai_summary solo vía RPC autenticada (sin service role en la API)
CREATE OR REPLACE FUNCTION public.set_product_ai_summary(
  p_product_id UUID,
  p_summary TEXT
)
RETURNS VOID AS $$
DECLARE
  v_existing TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT ai_summary INTO v_existing
  FROM products
  WHERE id = p_product_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product not found';
  END IF;

  IF v_existing IS NOT NULL AND NOT is_moderator_or_above() THEN
    RAISE EXCEPTION 'summary already set';
  END IF;

  UPDATE products
  SET ai_summary = p_summary,
      updated_at = NOW()
  WHERE id = p_product_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.set_product_ai_summary(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_product_ai_summary(UUID, TEXT) TO authenticated;

-- 4) Quitar UPDATE de productos para cualquier usuario autenticado
DROP POLICY IF EXISTS "products_auth_update" ON products;

-- Staff (moderador+) ya tiene products_staff_update (014)

-- 5) Imágenes: ya no cualquier auth puede UPDATE cualquier fila
DROP POLICY IF EXISTS "product_images_auth_update" ON product_images;

CREATE POLICY "product_images_own_update"
  ON product_images
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- product_images_admin_update (015) sigue para admin+
