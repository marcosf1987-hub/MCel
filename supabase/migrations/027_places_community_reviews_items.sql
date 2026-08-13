-- Places: moderación comunitaria + reviews + ítems del local

CREATE TYPE place_status AS ENUM ('pending', 'published', 'rejected');

ALTER TABLE places
  ADD COLUMN status place_status NOT NULL DEFAULT 'published',
  ADD COLUMN rejection_note TEXT,
  ADD COLUMN reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN reviewed_at TIMESTAMPTZ,
  ADD COLUMN weighted_rating DOUBLE PRECISION,
  ADD COLUMN review_count INT NOT NULL DEFAULT 0;

-- Locales ya existentes (admin) quedan publicados
UPDATE places SET status = 'published' WHERE status IS NOT NULL;

CREATE INDEX idx_places_status_pending
  ON places (created_at DESC)
  WHERE status = 'pending' AND deleted_at IS NULL;

CREATE INDEX idx_places_published
  ON places (name)
  WHERE status = 'published' AND deleted_at IS NULL;

DROP POLICY IF EXISTS "places_public_read" ON places;
CREATE POLICY "places_public_read"
  ON places FOR SELECT
  USING (deleted_at IS NULL AND status = 'published');

-- Dueño ve sus propuestas (pending/rejected)
CREATE POLICY "places_own_select"
  ON places FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "places_auth_insert_pending"
  ON places FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND status = 'pending'
    AND deleted_at IS NULL
  );

-- Staff (mod+) puede publicar / rechazar / editar
CREATE POLICY "places_staff_update"
  ON places FOR UPDATE
  TO authenticated
  USING (is_moderator_or_above())
  WITH CHECK (is_moderator_or_above());

-- Admin keep full insert (published directo)
-- places_admin_insert ya existe

-- ---------------------------------------------------------------------------
-- place_reviews
-- ---------------------------------------------------------------------------
CREATE TABLE place_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  opinion TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (place_id, user_id)
);

CREATE INDEX idx_place_reviews_place
  ON place_reviews (place_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER tr_place_reviews_updated
  BEFORE UPDATE ON place_reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE place_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "place_reviews_public_read"
  ON place_reviews FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "place_reviews_own_insert"
  ON place_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "place_reviews_own_update"
  ON place_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "place_reviews_own_delete"
  ON place_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "place_reviews_staff_select"
  ON place_reviews FOR SELECT
  TO authenticated
  USING (is_moderator_or_above());

CREATE POLICY "place_reviews_staff_update"
  ON place_reviews FOR UPDATE
  TO authenticated
  USING (is_moderator_or_above())
  WITH CHECK (is_moderator_or_above());

CREATE OR REPLACE FUNCTION recalculate_place_rating(p_place_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg DOUBLE PRECISION;
  v_count INT;
BEGIN
  SELECT AVG(rating)::DOUBLE PRECISION, COUNT(*)::INT
  INTO v_avg, v_count
  FROM place_reviews
  WHERE place_id = p_place_id AND deleted_at IS NULL;

  UPDATE places
  SET
    weighted_rating = v_avg,
    review_count = COALESCE(v_count, 0)
  WHERE id = p_place_id;
END;
$$;

CREATE OR REPLACE FUNCTION trg_recalculate_place_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_place_rating(OLD.place_id);
    RETURN OLD;
  END IF;
  PERFORM recalculate_place_rating(NEW.place_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_place_reviews_rating
  AFTER INSERT OR UPDATE OR DELETE ON place_reviews
  FOR EACH ROW EXECUTE FUNCTION trg_recalculate_place_rating();

GRANT EXECUTE ON FUNCTION recalculate_place_rating(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- place_items + place_item_reviews
-- ---------------------------------------------------------------------------
CREATE TABLE place_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  weighted_rating DOUBLE PRECISION,
  review_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_place_items_place
  ON place_items (place_id, name)
  WHERE deleted_at IS NULL;

CREATE TRIGGER tr_place_items_updated
  BEFORE UPDATE ON place_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE place_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "place_items_public_read"
  ON place_items FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "place_items_auth_insert"
  ON place_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "place_items_own_update"
  ON place_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR is_moderator_or_above())
  WITH CHECK (auth.uid() = created_by OR is_moderator_or_above());

CREATE POLICY "place_items_staff_delete"
  ON place_items FOR DELETE
  TO authenticated
  USING (is_moderator_or_above());

CREATE TABLE place_item_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_item_id UUID NOT NULL REFERENCES place_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  opinion TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (place_item_id, user_id)
);

CREATE INDEX idx_place_item_reviews_item
  ON place_item_reviews (place_item_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER tr_place_item_reviews_updated
  BEFORE UPDATE ON place_item_reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE place_item_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "place_item_reviews_public_read"
  ON place_item_reviews FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "place_item_reviews_own_insert"
  ON place_item_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "place_item_reviews_own_update"
  ON place_item_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "place_item_reviews_own_delete"
  ON place_item_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "place_item_reviews_staff_update"
  ON place_item_reviews FOR UPDATE
  TO authenticated
  USING (is_moderator_or_above())
  WITH CHECK (is_moderator_or_above());

CREATE OR REPLACE FUNCTION recalculate_place_item_rating(p_item_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg DOUBLE PRECISION;
  v_count INT;
BEGIN
  SELECT AVG(rating)::DOUBLE PRECISION, COUNT(*)::INT
  INTO v_avg, v_count
  FROM place_item_reviews
  WHERE place_item_id = p_item_id AND deleted_at IS NULL;

  UPDATE place_items
  SET
    weighted_rating = v_avg,
    review_count = COALESCE(v_count, 0)
  WHERE id = p_item_id;
END;
$$;

CREATE OR REPLACE FUNCTION trg_recalculate_place_item_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_place_item_rating(OLD.place_item_id);
    RETURN OLD;
  END IF;
  PERFORM recalculate_place_item_rating(NEW.place_item_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_place_item_reviews_rating
  AFTER INSERT OR UPDATE OR DELETE ON place_item_reviews
  FOR EACH ROW EXECUTE FUNCTION trg_recalculate_place_item_rating();

GRANT EXECUTE ON FUNCTION recalculate_place_item_rating(UUID) TO authenticated;
