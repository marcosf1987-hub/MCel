-- Destacado manual en inicio (Veredicto de la Semana)

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_home_featured BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN products.is_home_featured IS
  'Si true, aparece como Veredicto de la Semana en la home (máximo uno).';

-- Como máximo un producto destacado a la vez
CREATE UNIQUE INDEX IF NOT EXISTS products_one_home_featured_idx
  ON products ((1))
  WHERE is_home_featured = true;
