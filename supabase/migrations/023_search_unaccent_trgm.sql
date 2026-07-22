-- Búsqueda tolerante: sin tildes, sin artículos y variantes cercanas (trigram)

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.immutable_unaccent(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$
  SELECT unaccent(value);
$$;

CREATE OR REPLACE FUNCTION public.normalize_search_text(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
AS $$
  SELECT trim(BOTH FROM regexp_replace(
    public.immutable_unaccent(lower(coalesce(value, ''))),
    '\s+',
    ' ',
    'g'
  ));
$$;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS name_search text
  GENERATED ALWAYS AS (public.normalize_search_text(name)) STORED;

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS name_search text
  GENERATED ALWAYS AS (public.normalize_search_text(name)) STORED;

CREATE INDEX IF NOT EXISTS idx_products_name_search_trgm
  ON products USING gin (name_search gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_brands_name_search_trgm
  ON brands USING gin (name_search gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.search_query_tokens(p_query text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
AS $$
  SELECT coalesce(array_agg(token ORDER BY ordinality), ARRAY[]::text[])
  FROM (
    SELECT token, min(ordinality) AS ordinality
    FROM unnest(
      regexp_split_to_array(public.normalize_search_text(p_query), '[^a-z0-9]+')
    ) WITH ORDINALITY AS u(token, ordinality)
    WHERE length(token) >= 2
      AND token NOT IN (
        'de', 'del', 'la', 'el', 'los', 'las', 'y', 'o', 'u',
        'con', 'sin', 'a', 'al', 'un', 'una', 'unos', 'unas',
        'en', 'por', 'para', 'lo', 'le', 'se'
      )
    GROUP BY token
  ) t;
$$;

CREATE OR REPLACE FUNCTION public.search_product_ids(
  p_query text,
  p_limit int DEFAULT 48
)
RETURNS TABLE (id uuid, score real)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_tokens text[];
  v_limit int;
BEGIN
  v_norm := public.normalize_search_text(p_query);
  IF v_norm IS NULL OR length(v_norm) < 2 THEN
    RETURN;
  END IF;

  v_tokens := public.search_query_tokens(p_query);
  IF coalesce(cardinality(v_tokens), 0) = 0 THEN
    v_tokens := ARRAY[v_norm];
  END IF;

  v_limit := GREATEST(1, LEAST(coalesce(p_limit, 48), 100));

  RETURN QUERY
  SELECT
    p.id,
    (
      CASE
        WHEN p.name_search = v_norm THEN 100
        WHEN p.name_search LIKE v_norm || '%' THEN 80
        WHEN p.name_search LIKE '%' || v_norm || '%' THEN 55
        ELSE 0
      END
      + CASE
          WHEN (
            SELECT bool_and(p.name_search LIKE '%' || tok || '%')
            FROM unnest(v_tokens) AS tok
          ) THEN 40
          ELSE 0
        END
      + (similarity(p.name_search, v_norm) * 50)
    )::real AS score
  FROM products p
  WHERE p.deleted_at IS NULL
    AND (
      (
        SELECT bool_and(p.name_search LIKE '%' || tok || '%')
        FROM unnest(v_tokens) AS tok
      )
      OR p.name_search % v_norm
      OR similarity(p.name_search, v_norm) >= 0.28
    )
  ORDER BY score DESC, p.review_count DESC NULLS LAST, p.name ASC
  LIMIT v_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_catalog_suggestions(
  p_query text,
  p_limit int DEFAULT 12
)
RETURNS TABLE (
  result_type text,
  label text,
  href text,
  score real
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_tokens text[];
  v_limit int;
BEGIN
  v_norm := public.normalize_search_text(p_query);
  IF v_norm IS NULL OR length(v_norm) < 2 THEN
    RETURN;
  END IF;

  v_tokens := public.search_query_tokens(p_query);
  IF coalesce(cardinality(v_tokens), 0) = 0 THEN
    v_tokens := ARRAY[v_norm];
  END IF;

  v_limit := GREATEST(1, LEAST(coalesce(p_limit, 12), 20));

  RETURN QUERY
  WITH brand_hits AS (
    SELECT
      'Marca'::text AS result_type,
      b.name AS label,
      ('/marcas/' || b.slug)::text AS href,
      (
        CASE
          WHEN b.name_search = v_norm THEN 100
          WHEN b.name_search LIKE '%' || v_norm || '%' THEN 60
          ELSE 0
        END
        + (similarity(b.name_search, v_norm) * 40)
      )::real AS score
    FROM brands b
    WHERE (
      (
        SELECT bool_and(b.name_search LIKE '%' || tok || '%')
        FROM unnest(v_tokens) AS tok
      )
      OR b.name_search % v_norm
      OR similarity(b.name_search, v_norm) >= 0.28
    )
    ORDER BY score DESC, b.name ASC
    LIMIT 3
  ),
  category_hits AS (
    SELECT
      'Categoría'::text AS result_type,
      coalesce(c.name_es, c.name) AS label,
      ('/categorias/' || c.slug)::text AS href,
      (
        CASE
          WHEN public.normalize_search_text(coalesce(c.name_es, c.name)) LIKE '%' || v_norm || '%' THEN 70
          ELSE similarity(public.normalize_search_text(coalesce(c.name_es, c.name)), v_norm) * 50
        END
      )::real AS score
    FROM categories c
    WHERE (
      SELECT bool_and(
        public.normalize_search_text(coalesce(c.name_es, c.name)) LIKE '%' || tok || '%'
      )
      FROM unnest(v_tokens) AS tok
    )
    OR similarity(public.normalize_search_text(coalesce(c.name_es, c.name)), v_norm) >= 0.35
    ORDER BY score DESC
    LIMIT 3
  ),
  subcategory_hits AS (
    SELECT
      'Subcategoría'::text AS result_type,
      coalesce(s.name_es, s.name) AS label,
      ('/subcategorias/' || s.slug)::text AS href,
      (
        CASE
          WHEN public.normalize_search_text(coalesce(s.name_es, s.name)) LIKE '%' || v_norm || '%' THEN 65
          ELSE similarity(public.normalize_search_text(coalesce(s.name_es, s.name)), v_norm) * 45
        END
      )::real AS score
    FROM subcategories s
    WHERE (
      SELECT bool_and(
        public.normalize_search_text(coalesce(s.name_es, s.name)) LIKE '%' || tok || '%'
      )
      FROM unnest(v_tokens) AS tok
    )
    OR similarity(public.normalize_search_text(coalesce(s.name_es, s.name)), v_norm) >= 0.35
    ORDER BY score DESC
    LIMIT 3
  ),
  product_hits AS (
    SELECT
      'Producto'::text AS result_type,
      p.name AS label,
      ('/productos/' || p.slug)::text AS href,
      sp.score
    FROM public.search_product_ids(p_query, 5) sp
    JOIN products p ON p.id = sp.id
  ),
  combined AS (
    SELECT * FROM brand_hits
    UNION ALL
    SELECT * FROM category_hits
    UNION ALL
    SELECT * FROM subcategory_hits
    UNION ALL
    SELECT * FROM product_hits
  )
  SELECT c.result_type, c.label, c.href, c.score
  FROM combined c
  ORDER BY c.score DESC, c.label ASC
  LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.immutable_unaccent(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_search_text(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_query_tokens(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_product_ids(text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_catalog_suggestions(text, int) TO anon, authenticated;
