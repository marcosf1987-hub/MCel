-- Fase B: cola de reportes y moderación de listas

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderator_note TEXT;

ALTER TABLE product_lists
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_lists_not_deleted
  ON product_lists (created_at DESC)
  WHERE deleted_at IS NULL;

-- Ocultar listas soft-deleted en lectura pública
DROP POLICY IF EXISTS "product_lists_select" ON product_lists;
CREATE POLICY "product_lists_select"
  ON product_lists FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      visibility = 'public'
      OR visibility = 'unlisted'
      OR auth.uid() = user_id
      OR EXISTS (
        SELECT 1 FROM list_collaborators c
        WHERE c.list_id = product_lists.id AND c.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "product_lists_staff_select" ON product_lists;
CREATE POLICY "product_lists_staff_select"
  ON product_lists FOR SELECT
  TO authenticated
  USING (is_moderator_or_above());

DROP POLICY IF EXISTS "product_lists_staff_update" ON product_lists;
CREATE POLICY "product_lists_staff_update"
  ON product_lists FOR UPDATE
  TO authenticated
  USING (is_moderator_or_above())
  WITH CHECK (is_moderator_or_above());

-- Moderadores pueden soft-delete productos (antes solo admin)
DROP POLICY IF EXISTS "products_admin_update" ON products;
CREATE POLICY "products_staff_update"
  ON products FOR UPDATE
  TO authenticated
  USING (is_moderator_or_above())
  WITH CHECK (is_moderator_or_above());
