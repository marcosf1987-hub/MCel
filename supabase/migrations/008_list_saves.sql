-- Fase 2: guardar listas de otros usuarios en tu biblioteca

ALTER TABLE product_lists ADD COLUMN IF NOT EXISTS save_count INT NOT NULL DEFAULT 0;

CREATE TABLE list_saves (
  list_id UUID NOT NULL REFERENCES product_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (list_id, user_id)
);

CREATE INDEX idx_list_saves_user ON list_saves(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION trg_list_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_lists SET save_count = save_count + 1 WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_lists SET save_count = GREATEST(0, save_count - 1) WHERE id = OLD.list_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER list_saves_count_insert
  AFTER INSERT ON list_saves
  FOR EACH ROW EXECUTE FUNCTION trg_list_save_count();

CREATE TRIGGER list_saves_count_delete
  AFTER DELETE ON list_saves
  FOR EACH ROW EXECUTE FUNCTION trg_list_save_count();

ALTER TABLE list_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "list_saves_select_own"
  ON list_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "list_saves_insert_own"
  ON list_saves FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM product_lists pl
      WHERE pl.id = list_id
        AND pl.visibility IN ('public', 'unlisted')
        AND pl.user_id <> auth.uid()
        AND pl.is_system = FALSE
    )
  );

CREATE POLICY "list_saves_delete_own"
  ON list_saves FOR DELETE
  USING (auth.uid() = user_id);
