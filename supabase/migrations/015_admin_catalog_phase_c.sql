-- Fase C: ABM catálogo admin + override imágenes

-- Marcas: admin puede editar y borrar
DROP POLICY IF EXISTS "brands_admin_update" ON brands;
CREATE POLICY "brands_admin_update"
  ON brands FOR UPDATE
  TO authenticated
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

DROP POLICY IF EXISTS "brands_admin_delete" ON brands;
CREATE POLICY "brands_admin_delete"
  ON brands FOR DELETE
  TO authenticated
  USING (is_admin_or_above());

-- Categorías
DROP POLICY IF EXISTS "categories_admin_update" ON categories;
CREATE POLICY "categories_admin_update"
  ON categories FOR UPDATE
  TO authenticated
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
CREATE POLICY "categories_admin_delete"
  ON categories FOR DELETE
  TO authenticated
  USING (is_admin_or_above());

-- Subcategorías
DROP POLICY IF EXISTS "subcategories_admin_update" ON subcategories;
CREATE POLICY "subcategories_admin_update"
  ON subcategories FOR UPDATE
  TO authenticated
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

DROP POLICY IF EXISTS "subcategories_admin_delete" ON subcategories;
CREATE POLICY "subcategories_admin_delete"
  ON subcategories FOR DELETE
  TO authenticated
  USING (is_admin_or_above());

-- Productos: admin puede crear desde panel
DROP POLICY IF EXISTS "products_admin_insert" ON products;
CREATE POLICY "products_admin_insert"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_above());

-- Imágenes: admin override calidad, portada y visibilidad
DROP POLICY IF EXISTS "product_images_admin_update" ON product_images;
CREATE POLICY "product_images_admin_update"
  ON product_images FOR UPDATE
  TO authenticated
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

CREATE INDEX IF NOT EXISTS idx_product_images_needs_review
  ON product_images (created_at DESC)
  WHERE quality_status = 'needs_review';
