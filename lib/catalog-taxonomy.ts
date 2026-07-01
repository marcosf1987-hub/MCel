export type TaxonomySubcategory = {
  id: string;
  name: string;
  name_es: string | null;
  slug: string;
};

export type TaxonomyCategory = {
  id: string;
  name: string;
  name_es: string | null;
  slug: string;
  subcategories: TaxonomySubcategory[];
};

export type TaxonomySelection = {
  categoryId: string;
  subcategoryId: string;
};

/** Orden fijo de navegación (slugs de categoría). */
export const TAXONOMY_CATEGORY_ORDER = [
  "almacen-y-despensa",
  "panaderia-y-reposteria",
  "snacks-y-golosinas",
  "lacteos",
  "congelados-y-comidas-listas",
  "bebidas",
  "otros",
] as const;

export function sortTaxonomyCategories<T extends Pick<TaxonomyCategory, "slug" | "name" | "name_es">>(
  categories: T[]
): T[] {
  const order = new Map(
    TAXONOMY_CATEGORY_ORDER.map((slug, index) => [slug, index])
  );
  return [...categories].sort((a, b) => {
    const ai = order.get(a.slug as (typeof TAXONOMY_CATEGORY_ORDER)[number]) ?? 99;
    const bi = order.get(b.slug as (typeof TAXONOMY_CATEGORY_ORDER)[number]) ?? 99;
    if (ai !== bi) return ai - bi;
    return (a.name_es ?? a.name).localeCompare(b.name_es ?? b.name, "es");
  });
}

export function flattenTaxonomyOptions(categories: TaxonomyCategory[]) {
  const sorted = sortTaxonomyCategories(categories);
  return sorted.flatMap((category) => {
    const categoryLabel = category.name_es ?? category.name;
    return category.subcategories.map((sub) => {
      const subLabel = sub.name_es ?? sub.name;
      return {
        categoryId: category.id,
        subcategoryId: sub.id,
        categorySlug: category.slug,
        subcategorySlug: sub.slug,
        categoryLabel,
        subLabel,
        label: `${categoryLabel} › ${subLabel}`,
        searchText: `${categoryLabel} ${subLabel} ${category.slug} ${sub.slug}`.toLowerCase(),
      };
    });
  });
}

export function findOtrosSelection(
  categories: TaxonomyCategory[]
): TaxonomySelection | null {
  const otrosCat = categories.find((c) => c.slug === "otros");
  const otrosSub = otrosCat?.subcategories.find((s) => s.slug === "otros");
  if (!otrosCat || !otrosSub) return null;
  return { categoryId: otrosCat.id, subcategoryId: otrosSub.id };
}

export function findSubcategoryOtros(
  categories: TaxonomyCategory[],
  categorySlug: string
): TaxonomySelection | null {
  const cat = categories.find((c) => c.slug === categorySlug);
  const sub = cat?.subcategories.find((s) => s.slug === "otros");
  if (!cat || !sub) return null;
  return { categoryId: cat.id, subcategoryId: sub.id };
}

export function labelForSelection(
  categories: TaxonomyCategory[],
  selection: TaxonomySelection | null
): string | null {
  if (!selection) return null;
  const cat = categories.find((c) => c.id === selection.categoryId);
  const sub = cat?.subcategories.find((s) => s.id === selection.subcategoryId);
  if (!cat || !sub) return null;
  return `${cat.name_es ?? cat.name} › ${sub.name_es ?? sub.name}`;
}
