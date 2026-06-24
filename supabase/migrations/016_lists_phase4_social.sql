-- Fase 4 listas sociales: roles de colaborador y notificaciones

CREATE TYPE list_collaborator_role AS ENUM ('viewer', 'editor');
CREATE TYPE list_notification_type AS ENUM ('list_vote', 'list_comment');

ALTER TABLE list_collaborators
  ADD COLUMN IF NOT EXISTS role list_collaborator_role NOT NULL DEFAULT 'editor';

CREATE TABLE IF NOT EXISTS list_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES product_lists(id) ON DELETE CASCADE,
  type list_notification_type NOT NULL,
  comment_id UUID REFERENCES list_comments(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_list_notifications_user
  ON list_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_list_notifications_unread
  ON list_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE list_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "list_notifications_select_own" ON list_notifications;
CREATE POLICY "list_notifications_select_own"
  ON list_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "list_notifications_insert_actor" ON list_notifications;
CREATE POLICY "list_notifications_insert_actor"
  ON list_notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);

DROP POLICY IF EXISTS "list_notifications_update_own" ON list_notifications;
CREATE POLICY "list_notifications_update_own"
  ON list_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Solo editores (no viewers) pueden modificar ítems
DROP POLICY IF EXISTS "product_list_items_insert_editor" ON product_list_items;
CREATE POLICY "product_list_items_insert_editor"
  ON product_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM list_collaborators c
      WHERE c.list_id = list_id
        AND c.user_id = auth.uid()
        AND c.role = 'editor'::list_collaborator_role
    )
  );

DROP POLICY IF EXISTS "product_list_items_delete_editor" ON product_list_items;
CREATE POLICY "product_list_items_delete_editor"
  ON product_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM list_collaborators c
      WHERE c.list_id = list_id
        AND c.user_id = auth.uid()
        AND c.role = 'editor'::list_collaborator_role
    )
  );

DROP POLICY IF EXISTS "product_list_items_update_editor" ON product_list_items;
CREATE POLICY "product_list_items_update_editor"
  ON product_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM list_collaborators c
      WHERE c.list_id = list_id
        AND c.user_id = auth.uid()
        AND c.role = 'editor'::list_collaborator_role
    )
  );

DROP POLICY IF EXISTS "list_collaborators_update_owner" ON list_collaborators;
CREATE POLICY "list_collaborators_update_owner"
  ON list_collaborators FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
  );
