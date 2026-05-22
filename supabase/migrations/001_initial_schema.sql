-- Comunidad Celíacos - Schema inicial

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_tier AS ENUM ('none', 'bronze', 'silver', 'gold');
CREATE TYPE gluten_certification AS ENUM (
  'sin_tacc', 'sin_gluten', 'con_trazas', 'no_certificado', 'desconocido'
);
CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');
CREATE TYPE report_target_type AS ENUM ('product', 'review');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{"profile_public": true, "locale": "es-AR"}'::jsonb,
  collaboration_count INT NOT NULL DEFAULT 0,
  tier user_tier NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Catalog
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_es TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_es TEXT,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT NOT NULL UNIQUE,
  brand_id UUID NOT NULL REFERENCES brands(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  subcategory_id UUID NOT NULL REFERENCES subcategories(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  ai_summary TEXT,
  weighted_rating NUMERIC(3,2),
  review_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  opinion TEXT NOT NULL,
  general_description TEXT NOT NULL,
  taste TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  gluten_certification gluten_certification NOT NULL DEFAULT 'desconocido',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type report_target_type NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status report_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_subcategory ON products(subcategory_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_rating ON products(weighted_rating DESC NULLS LAST);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX idx_brands_name ON brands(name);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_subcategories_category ON subcategories(category_id);

-- Tier from collaboration count
CREATE OR REPLACE FUNCTION compute_tier(count INT)
RETURNS user_tier AS $$
BEGIN
  IF count >= 100 THEN RETURN 'gold';
  ELSIF count >= 50 THEN RETURN 'silver';
  ELSIF count >= 10 THEN RETURN 'bronze';
  ELSE RETURN 'none';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION tier_weight(t user_tier)
RETURNS NUMERIC AS $$
BEGIN
  CASE t
    WHEN 'gold' THEN RETURN 1.55;
    WHEN 'silver' THEN RETURN 1.3;
    WHEN 'bronze' THEN RETURN 1.0;
    ELSE RETURN 0.7;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Recalculate product weighted rating
CREATE OR REPLACE FUNCTION recalculate_product_rating(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
  v_weighted NUMERIC;
  v_count INT;
BEGIN
  SELECT
    ROUND(
      (SUM(r.rating * tier_weight(pr.tier)) / NULLIF(SUM(tier_weight(pr.tier)), 0))::numeric,
      2
    ),
    COUNT(*)::int
  INTO v_weighted, v_count
  FROM reviews r
  JOIN profiles pr ON pr.id = r.user_id
  WHERE r.product_id = p_product_id;

  UPDATE products
  SET weighted_rating = v_weighted,
      review_count = COALESCE(v_count, 0),
      updated_at = NOW()
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- On new review: bump collaboration, tier, recalc rating
CREATE OR REPLACE FUNCTION on_review_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE profiles
  SET collaboration_count = collaboration_count + 1,
      tier = compute_tier(collaboration_count + 1),
      updated_at = NOW()
  WHERE id = NEW.user_id;

  PERFORM recalculate_product_rating(NEW.product_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION on_review_insert();

CREATE OR REPLACE FUNCTION on_review_update_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET collaboration_count = GREATEST(0, collaboration_count - 1),
        tier = compute_tier(GREATEST(0, collaboration_count - 1)),
        updated_at = NOW()
    WHERE id = OLD.user_id;
    PERFORM recalculate_product_rating(OLD.product_id);
    RETURN OLD;
  ELSE
    PERFORM recalculate_product_rating(NEW.product_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_review_update
  AFTER UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION on_review_update_delete();

CREATE TRIGGER tr_review_delete
  AFTER DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION on_review_update_delete();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'preferred_username', split_part(NEW.email, '@', 1)), ' ', '_')) || '_' || SUBSTR(NEW.id::text, 1, 6)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tr_reviews_updated BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Public read catalog
CREATE POLICY "brands_public_read" ON brands FOR SELECT USING (true);
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "subcategories_public_read" ON subcategories FOR SELECT USING (true);
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
CREATE POLICY "product_images_public_read" ON product_images FOR SELECT USING (true);

-- Profiles: public read if public preference, own write
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (
  (preferences->>'profile_public')::boolean IS NOT FALSE
  OR auth.uid() = id
);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Reviews: authenticated users read all; anon can use view (see below)
CREATE POLICY "reviews_auth_read" ON reviews FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "reviews_own_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_own_update" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_own_delete" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Latest review preview for anonymous (via security definer function)
CREATE OR REPLACE FUNCTION get_latest_review(p_product_id UUID)
RETURNS TABLE (
  id UUID,
  rating INT,
  opinion TEXT,
  general_description TEXT,
  taste TEXT,
  price NUMERIC,
  gluten_certification gluten_certification,
  created_at TIMESTAMPTZ,
  display_name TEXT,
  tier user_tier
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.rating, r.opinion, r.general_description, r.taste, r.price,
         r.gluten_certification, r.created_at, p.display_name, p.tier
  FROM reviews r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.product_id = p_product_id
  ORDER BY r.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_latest_review(UUID) TO anon, authenticated;

-- Products insert/update for authenticated
CREATE POLICY "products_auth_insert" ON products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "products_auth_update" ON products FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "product_images_auth_insert" ON product_images FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Brands/categories insert for authenticated (get-or-create flow)
CREATE POLICY "brands_auth_insert" ON brands FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "categories_auth_insert" ON categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "subcategories_auth_insert" ON subcategories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Favorites
CREATE POLICY "favorites_own" ON favorites FOR ALL USING (auth.uid() = user_id);

-- Reports
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_own_read" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- Storage bucket (run in Supabase dashboard or via SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product_images_storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_storage_auth_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "product_images_storage_own_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
