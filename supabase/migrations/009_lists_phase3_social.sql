-- Fase 3: voto negativo, seguir usuarios, colaboradores, comentarios

CREATE TYPE list_vote_type AS ENUM ('up', 'down');

ALTER TABLE product_lists ADD COLUMN IF NOT EXISTS downvote_count INT NOT NULL DEFAULT 0;

ALTER TABLE list_votes ADD COLUMN IF NOT EXISTS vote_type list_vote_type NOT NULL DEFAULT 'up';

-- Recalcular contadores desde votos existentes (todos eran positivos)
UPDATE product_lists pl SET vote_count = COALESCE((
  SELECT COUNT(*)::INT FROM list_votes v WHERE v.list_id = pl.id AND v.vote_type = 'up'
), 0);

UPDATE product_lists pl SET downvote_count = COALESCE((
  SELECT COUNT(*)::INT FROM list_votes v WHERE v.list_id = pl.id AND v.vote_type = 'down'
), 0);

DROP TRIGGER IF EXISTS list_votes_count_insert ON list_votes;
DROP TRIGGER IF EXISTS list_votes_count_delete ON list_votes;
DROP FUNCTION IF EXISTS trg_list_vote_count();

CREATE OR REPLACE FUNCTION trg_list_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE product_lists SET vote_count = vote_count + 1 WHERE id = NEW.list_id;
    ELSE
      UPDATE product_lists SET downvote_count = downvote_count + 1 WHERE id = NEW.list_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE product_lists SET vote_count = GREATEST(0, vote_count - 1) WHERE id = OLD.list_id;
    ELSE
      UPDATE product_lists SET downvote_count = GREATEST(0, downvote_count - 1) WHERE id = OLD.list_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.vote_type IS DISTINCT FROM NEW.vote_type THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE product_lists SET vote_count = GREATEST(0, vote_count - 1) WHERE id = OLD.list_id;
    ELSE
      UPDATE product_lists SET downvote_count = GREATEST(0, downvote_count - 1) WHERE id = OLD.list_id;
    END IF;
    IF NEW.vote_type = 'up' THEN
      UPDATE product_lists SET vote_count = vote_count + 1 WHERE id = NEW.list_id;
    ELSE
      UPDATE product_lists SET downvote_count = downvote_count + 1 WHERE id = NEW.list_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER list_votes_count_change
  AFTER INSERT OR UPDATE OR DELETE ON list_votes
  FOR EACH ROW EXECUTE FUNCTION trg_list_vote_count();

DROP POLICY IF EXISTS "list_votes_update_own" ON list_votes;
CREATE POLICY "list_votes_update_own"
  ON list_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seguir usuarios
CREATE TABLE user_follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_follows_select" ON user_follows FOR SELECT USING (true);

CREATE POLICY "user_follows_insert_own"
  ON user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "user_follows_delete_own"
  ON user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Colaboradores en listas (no listas sistema)
CREATE TABLE list_collaborators (
  list_id UUID NOT NULL REFERENCES product_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (list_id, user_id)
);

CREATE INDEX idx_list_collaborators_user ON list_collaborators(user_id);

ALTER TABLE list_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "list_collaborators_select"
  ON list_collaborators FOR SELECT USING (true);

CREATE POLICY "list_collaborators_insert_owner"
  ON list_collaborators FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by
    AND EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid() AND pl.is_system = FALSE
    )
  );

CREATE POLICY "list_collaborators_delete_owner"
  ON list_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
  );

-- Comentarios en listas
CREATE TABLE list_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES product_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(trim(body)) >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_list_comments_list ON list_comments(list_id, created_at DESC);

ALTER TABLE list_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "list_comments_select"
  ON list_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id
        AND (pl.visibility IN ('public', 'unlisted') OR pl.user_id = auth.uid())
    )
  );

CREATE POLICY "list_comments_insert"
  ON list_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id
        AND (
          pl.visibility IN ('public', 'unlisted')
          OR pl.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM list_collaborators c
            WHERE c.list_id = pl.id AND c.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "list_comments_delete_own"
  ON list_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "list_comments_delete_list_owner"
  ON list_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
  );

-- Colaboradores pueden editar ítems de la lista
DROP POLICY IF EXISTS "product_list_items_insert_own" ON product_list_items;
DROP POLICY IF EXISTS "product_list_items_delete_own" ON product_list_items;
DROP POLICY IF EXISTS "product_list_items_update_own" ON product_list_items;

CREATE POLICY "product_list_items_insert_editor"
  ON product_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM list_collaborators c
      WHERE c.list_id = list_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "product_list_items_delete_editor"
  ON product_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM list_collaborators c
      WHERE c.list_id = list_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "product_list_items_update_editor"
  ON product_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM list_collaborators c
      WHERE c.list_id = list_id AND c.user_id = auth.uid()
    )
  );

-- Colaboradores ven listas privadas donde fueron invitados
DROP POLICY IF EXISTS "product_lists_select" ON product_lists;
CREATE POLICY "product_lists_select"
  ON product_lists FOR SELECT
  USING (
    visibility IN ('public', 'unlisted')
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM list_collaborators c
      WHERE c.list_id = id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "product_list_items_select" ON product_list_items;
CREATE POLICY "product_list_items_select"
  ON product_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id
        AND (
          pl.visibility IN ('public', 'unlisted')
          OR pl.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM list_collaborators c
            WHERE c.list_id = pl.id AND c.user_id = auth.uid()
          )
        )
    )
  );
