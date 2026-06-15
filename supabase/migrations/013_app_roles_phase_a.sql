-- Fase A: roles de plataforma, suspensión, soft delete y base de auditoría

CREATE TYPE app_role AS ENUM ('user', 'moderator', 'admin', 'superadmin');

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS app_role app_role NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE list_comments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_app_role ON profiles (app_role);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles (is_suspended) WHERE is_suspended = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_not_deleted ON products (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_not_deleted ON reviews (created_at DESC) WHERE deleted_at IS NULL;

-- Helpers de rol (SECURITY DEFINER evita recursión RLS en profiles)
CREATE OR REPLACE FUNCTION current_app_role()
RETURNS app_role AS $$
  SELECT COALESCE(
    (SELECT p.app_role FROM profiles p WHERE p.id = auth.uid()),
    'user'::app_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_moderator_or_above()
RETURNS BOOLEAN AS $$
  SELECT current_app_role() IN ('moderator'::app_role, 'admin'::app_role, 'superadmin'::app_role);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS BOOLEAN AS $$
  SELECT current_app_role() IN ('admin'::app_role, 'superadmin'::app_role);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT current_app_role() = 'superadmin'::app_role;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_moderator_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_above() TO authenticated;
GRANT EXECUTE ON FUNCTION is_superadmin() TO authenticated;

-- Usuarios no pueden auto-promoverse ni des-suspenderse
CREATE OR REPLACE FUNCTION protect_profile_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.app_role IS DISTINCT FROM OLD.app_role AND NOT is_superadmin() THEN
    NEW.app_role := OLD.app_role;
  END IF;

  IF (
    NEW.is_suspended IS DISTINCT FROM OLD.is_suspended
    OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
    OR NEW.suspended_reason IS DISTINCT FROM OLD.suspended_reason
  ) AND NOT is_admin_or_above() THEN
    NEW.is_suspended := OLD.is_suspended;
    NEW.suspended_at := OLD.suspended_at;
    NEW.suspended_reason := OLD.suspended_reason;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_profiles_protect_privileged ON profiles;
CREATE TRIGGER tr_profiles_protect_privileged
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_privileged_fields();

-- Auditoría admin
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON admin_audit_log (actor_id, created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_audit_staff_read" ON admin_audit_log;
CREATE POLICY "admin_audit_staff_read"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (is_moderator_or_above());

DROP POLICY IF EXISTS "admin_audit_staff_insert" ON admin_audit_log;
CREATE POLICY "admin_audit_staff_insert"
  ON admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id AND is_moderator_or_above());

-- Catálogo público: ocultar soft-deleted
DROP POLICY IF EXISTS "products_public_read" ON products;
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "reviews_auth_read" ON reviews;
CREATE POLICY "reviews_auth_read"
  ON reviews FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Staff puede ver todo (incl. eliminados)
DROP POLICY IF EXISTS "products_staff_select" ON products;
CREATE POLICY "products_staff_select"
  ON products FOR SELECT
  TO authenticated
  USING (is_moderator_or_above());

DROP POLICY IF EXISTS "products_admin_update" ON products;
CREATE POLICY "products_admin_update"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

DROP POLICY IF EXISTS "reviews_staff_select" ON reviews;
CREATE POLICY "reviews_staff_select"
  ON reviews FOR SELECT
  TO authenticated
  USING (is_moderator_or_above());

DROP POLICY IF EXISTS "reviews_staff_update" ON reviews;
CREATE POLICY "reviews_staff_update"
  ON reviews FOR UPDATE
  TO authenticated
  USING (is_moderator_or_above())
  WITH CHECK (is_moderator_or_above());

DROP POLICY IF EXISTS "reviews_staff_delete" ON reviews;
CREATE POLICY "reviews_staff_delete"
  ON reviews FOR DELETE
  TO authenticated
  USING (is_moderator_or_above());

-- Perfiles: staff ve todos; admin+ puede actualizar
DROP POLICY IF EXISTS "profiles_staff_select" ON profiles;
CREATE POLICY "profiles_staff_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_moderator_or_above() OR auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

-- Reportes: cola de moderación
DROP POLICY IF EXISTS "reports_staff_read" ON reports;
CREATE POLICY "reports_staff_read"
  ON reports FOR SELECT
  TO authenticated
  USING (is_moderator_or_above() OR auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_staff_update" ON reports;
CREATE POLICY "reports_staff_update"
  ON reports FOR UPDATE
  TO authenticated
  USING (is_moderator_or_above())
  WITH CHECK (is_moderator_or_above());

-- Comentarios de listas: ocultar borrados + staff
DROP POLICY IF EXISTS "list_comments_select" ON list_comments;
CREATE POLICY "list_comments_select"
  ON list_comments FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id
        AND (pl.visibility IN ('public', 'unlisted') OR pl.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "list_comments_staff_select" ON list_comments;
CREATE POLICY "list_comments_staff_select"
  ON list_comments FOR SELECT
  TO authenticated
  USING (is_moderator_or_above());

DROP POLICY IF EXISTS "list_comments_staff_update" ON list_comments;
CREATE POLICY "list_comments_staff_update"
  ON list_comments FOR UPDATE
  TO authenticated
  USING (is_moderator_or_above())
  WITH CHECK (is_moderator_or_above());

DROP POLICY IF EXISTS "list_comments_staff_delete" ON list_comments;
CREATE POLICY "list_comments_staff_delete"
  ON list_comments FOR DELETE
  TO authenticated
  USING (is_moderator_or_above());

-- Primer superadmin: ejecutá manualmente reemplazando el email
-- UPDATE profiles
-- SET app_role = 'superadmin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'tu-email@gmail.com');
