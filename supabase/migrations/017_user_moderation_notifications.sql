-- Notificaciones de moderación y cuenta (ocultar contenido, suspensión, etc.)

CREATE TYPE user_notification_type AS ENUM (
  'content_hidden',
  'content_restored',
  'account_suspended',
  'account_unsuspended'
);

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type user_notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user
  ON user_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_unread
  ON user_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_notifications_select_own" ON user_notifications;
CREATE POLICY "user_notifications_select_own"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_notifications_update_own" ON user_notifications;
CREATE POLICY "user_notifications_update_own"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_notifications_insert_staff" ON user_notifications;
CREATE POLICY "user_notifications_insert_staff"
  ON user_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.app_role IN ('moderator', 'admin', 'superadmin')
    )
  );
