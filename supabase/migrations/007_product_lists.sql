-- Listas de productos (playlists sociales) + migración de favoritos

CREATE TYPE list_visibility AS ENUM ('public', 'unlisted', 'private');

CREATE TABLE product_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  visibility list_visibility NOT NULL DEFAULT 'private',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  vote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

CREATE TABLE product_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES product_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (list_id, product_id)
);

CREATE TABLE list_votes (
  list_id UUID NOT NULL REFERENCES product_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (list_id, user_id)
);

CREATE INDEX idx_product_lists_user ON product_lists(user_id);
CREATE INDEX idx_product_lists_visibility_votes ON product_lists(visibility, vote_count DESC);
CREATE INDEX idx_product_list_items_list ON product_list_items(list_id, sort_order);
CREATE INDEX idx_product_list_items_product ON product_list_items(product_id);
CREATE INDEX idx_list_votes_user ON list_votes(user_id);

ALTER TYPE report_target_type ADD VALUE IF NOT EXISTS 'list';

-- Contador de votos
CREATE OR REPLACE FUNCTION trg_list_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_lists SET vote_count = vote_count + 1 WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_lists SET vote_count = GREATEST(0, vote_count - 1) WHERE id = OLD.list_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER list_votes_count_insert
  AFTER INSERT ON list_votes
  FOR EACH ROW EXECUTE FUNCTION trg_list_vote_count();

CREATE TRIGGER list_votes_count_delete
  AFTER DELETE ON list_votes
  FOR EACH ROW EXECUTE FUNCTION trg_list_vote_count();

-- Migrar favoritos → lista sistema "Mis favoritos"
INSERT INTO product_lists (user_id, title, slug, description, visibility, is_system, vote_count)
SELECT DISTINCT
  f.user_id,
  'Mis favoritos',
  'mis-favoritos',
  'Productos que guardaste con el corazón',
  'private'::list_visibility,
  TRUE,
  0
FROM favorites f
ON CONFLICT (user_id, slug) DO NOTHING;

INSERT INTO product_list_items (list_id, product_id, sort_order)
SELECT
  pl.id,
  f.product_id,
  ROW_NUMBER() OVER (PARTITION BY f.user_id ORDER BY f.created_at ASC)::INT - 1
FROM favorites f
JOIN product_lists pl ON pl.user_id = f.user_id AND pl.slug = 'mis-favoritos' AND pl.is_system = TRUE
ON CONFLICT (list_id, product_id) DO NOTHING;

-- RLS
ALTER TABLE product_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_lists_select"
  ON product_lists FOR SELECT
  USING (
    visibility IN ('public', 'unlisted')
    OR auth.uid() = user_id
  );

CREATE POLICY "product_lists_insert_own"
  ON product_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "product_lists_update_own"
  ON product_lists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "product_lists_delete_own"
  ON product_lists FOR DELETE
  USING (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "product_list_items_select"
  ON product_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id
        AND (pl.visibility IN ('public', 'unlisted') OR pl.user_id = auth.uid())
    )
  );

CREATE POLICY "product_list_items_insert_own"
  ON product_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
  );

CREATE POLICY "product_list_items_delete_own"
  ON product_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
  );

CREATE POLICY "product_list_items_update_own"
  ON product_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id AND pl.user_id = auth.uid()
    )
  );

CREATE POLICY "list_votes_select"
  ON list_votes FOR SELECT USING (true);

CREATE POLICY "list_votes_insert_own"
  ON list_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "list_votes_delete_own"
  ON list_votes FOR DELETE USING (auth.uid() = user_id);
