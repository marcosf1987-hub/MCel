-- Locales y restaurantes (mapa) — módulo aditivo, no toca products/reviews
-- Próximos pasos (no incluidos): Google Places, place_reviews, place_items, cerca mío

CREATE TYPE place_type AS ENUM ('comercio', 'restaurante');

CREATE TYPE place_celiac_level AS ENUM (
  'opciones',
  'dedicado',
  'certificado',
  'desconocido'
);

CREATE TABLE places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  place_type place_type NOT NULL DEFAULT 'restaurante',
  description TEXT,
  address TEXT,
  city TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  phone TEXT,
  website TEXT,
  cover_image_url TEXT,
  google_place_id TEXT UNIQUE,
  celiac_level place_celiac_level NOT NULL DEFAULT 'desconocido',
  celiac_notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_places_not_deleted ON places (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_places_geo ON places (lat, lng) WHERE deleted_at IS NULL;
CREATE INDEX idx_places_type ON places (place_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_places_slug ON places (slug);

CREATE TRIGGER tr_places_updated
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "places_public_read"
  ON places FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "places_staff_select"
  ON places FOR SELECT
  TO authenticated
  USING (is_moderator_or_above());

CREATE POLICY "places_admin_insert"
  ON places FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_above());

CREATE POLICY "places_admin_update"
  ON places FOR UPDATE
  TO authenticated
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

CREATE POLICY "places_admin_delete"
  ON places FOR DELETE
  TO authenticated
  USING (is_admin_or_above());
