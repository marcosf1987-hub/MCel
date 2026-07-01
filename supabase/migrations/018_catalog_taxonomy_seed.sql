-- Taxonomía fija sin TACC + restricción de altas públicas

ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;

-- Categorías
INSERT INTO categories (name, name_es, slug, is_system) VALUES
  ('Almacén y Despensa', 'Almacén y Despensa', 'almacen-y-despensa', true),
  ('Panadería y Repostería', 'Panadería y Repostería', 'panaderia-y-reposteria', true),
  ('Snacks y Golosinas', 'Snacks y Golosinas', 'snacks-y-golosinas', true),
  ('Lácteos', 'Lácteos', 'lacteos', true),
  ('Congelados y Comidas Listas', 'Congelados y Comidas Listas', 'congelados-y-comidas-listas', true),
  ('Bebidas', 'Bebidas', 'bebidas', true),
  ('Otros', 'Otros', 'otros', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_es = EXCLUDED.name_es,
  is_system = true;

-- Subcategorías
INSERT INTO subcategories (category_id, name, name_es, slug, is_system)
SELECT c.id, v.name, v.name_es, v.slug, true
FROM categories c
JOIN (
  VALUES
    ('almacen-y-despensa', 'Harinas y Premezclas', 'Harinas y Premezclas', 'harinas-y-premezclas'),
    ('almacen-y-despensa', 'Arroz y Legumbres', 'Arroz y Legumbres', 'arroz-y-legumbres'),
    ('almacen-y-despensa', 'Cereales y Semillas', 'Cereales y Semillas', 'cereales-y-semillas'),
    ('almacen-y-despensa', 'Pastas y Fideos', 'Pastas y Fideos', 'pastas-y-fideos'),
    ('almacen-y-despensa', 'Aceites y Condimentos', 'Aceites y Condimentos', 'aceites-y-condimentos'),
    ('almacen-y-despensa', 'Conservas y Enlatados', 'Conservas y Enlatados', 'conservas-y-enlatados'),
    ('almacen-y-despensa', 'Dulces y Untables', 'Dulces y Untables', 'dulces-y-untables'),
    ('almacen-y-despensa', 'Otros', 'Otros', 'otros'),
    ('panaderia-y-reposteria', 'Panes', 'Panes', 'panes'),
    ('panaderia-y-reposteria', 'Salados', 'Salados', 'salados'),
    ('panaderia-y-reposteria', 'Repostería y Panificación Dulce', 'Repostería y Panificación Dulce', 'reposteria-y-panificacion-dulce'),
    ('panaderia-y-reposteria', 'Otros', 'Otros', 'otros'),
    ('snacks-y-golosinas', 'Snacks Salados', 'Snacks Salados', 'snacks-salados'),
    ('snacks-y-golosinas', 'Galletitas Dulces', 'Galletitas Dulces', 'galletitas-dulces'),
    ('snacks-y-golosinas', 'Chocolates y Confites', 'Chocolates y Confites', 'chocolates-y-confites'),
    ('snacks-y-golosinas', 'Alfajores y Barritas', 'Alfajores y Barritas', 'alfajores-y-barritas'),
    ('snacks-y-golosinas', 'Otros', 'Otros', 'otros'),
    ('lacteos', 'Leches y Cremas', 'Leches y Cremas', 'leches-y-cremas'),
    ('lacteos', 'Yogures y Postres', 'Yogures y Postres', 'yogures-y-postres'),
    ('lacteos', 'Quesos', 'Quesos', 'quesos'),
    ('lacteos', 'Mantecas y Margarinas', 'Mantecas y Margarinas', 'mantecas-y-margarinas'),
    ('lacteos', 'Otros', 'Otros', 'otros'),
    ('congelados-y-comidas-listas', 'Comidas Preparadas', 'Comidas Preparadas', 'comidas-preparadas'),
    ('congelados-y-comidas-listas', 'Vegetales y Papas Congeladas', 'Vegetales y Papas Congeladas', 'vegetales-y-papas-congeladas'),
    ('congelados-y-comidas-listas', 'Pastas Frescas Congeladas', 'Pastas Frescas Congeladas', 'pastas-frescas-congeladas'),
    ('congelados-y-comidas-listas', 'Carnes, Fiambres y Rebozados', 'Carnes, Fiambres y Rebozados', 'carnes-fiambres-y-rebozados'),
    ('congelados-y-comidas-listas', 'Otros', 'Otros', 'otros'),
    ('bebidas', 'Bebidas Sin Alcohol', 'Bebidas Sin Alcohol', 'bebidas-sin-alcohol'),
    ('bebidas', 'Bebidas Con Alcohol', 'Bebidas Con Alcohol', 'bebidas-con-alcohol'),
    ('bebidas', 'Infusiones', 'Infusiones', 'infusiones'),
    ('bebidas', 'Otros', 'Otros', 'otros'),
    ('otros', 'Otros', 'Otros', 'otros')
) AS v(cat_slug, name, name_es, slug) ON c.slug = v.cat_slug
ON CONFLICT (category_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  name_es = EXCLUDED.name_es,
  is_system = true;

-- Remapear productos existentes hacia taxonomía sistema
WITH fallback AS (
  SELECT c.id AS cat_id, s.id AS sub_id
  FROM categories c
  JOIN subcategories s ON s.category_id = c.id AND s.slug = 'otros'
  WHERE c.slug = 'otros'
  LIMIT 1
),
mapped AS (
  SELECT
    p.id AS product_id,
    COALESCE(sc.id, fb.cat_id) AS new_cat,
    COALESCE(ss.id, sc_otros.id, fb.sub_id) AS new_sub
  FROM products p
  JOIN categories oc ON oc.id = p.category_id
  JOIN subcategories os ON os.id = p.subcategory_id
  CROSS JOIN fallback fb
  LEFT JOIN categories sc ON sc.slug = oc.slug AND sc.is_system = true
  LEFT JOIN subcategories ss ON ss.category_id = sc.id AND ss.slug = os.slug AND ss.is_system = true
  LEFT JOIN subcategories sc_otros ON sc_otros.category_id = sc.id AND sc_otros.slug = 'otros'
)
UPDATE products p
SET category_id = m.new_cat, subcategory_id = m.new_sub
FROM mapped m
WHERE p.id = m.product_id;

-- Solo admin puede crear categorías/subcategorías
DROP POLICY IF EXISTS "categories_auth_insert" ON categories;
DROP POLICY IF EXISTS "subcategories_auth_insert" ON subcategories;

DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
CREATE POLICY "categories_admin_insert"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_above());

DROP POLICY IF EXISTS "subcategories_admin_insert" ON subcategories;
CREATE POLICY "subcategories_admin_insert"
  ON subcategories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_above());
