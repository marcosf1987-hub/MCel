export type SubcategoryWithCount = {
  id: string;
  name: string;
  name_es: string | null;
  slug: string;
  product_count: number;
};

export type CategoryWithCount = {
  id: string;
  name: string;
  name_es: string | null;
  slug: string;
  product_count: number;
  subcategories: SubcategoryWithCount[];
};

export type CategoriesNavData = {
  categories: CategoryWithCount[];
  totalProducts: number;
};

export function categoryDisplayName(cat: Pick<CategoryWithCount, "name" | "name_es">) {
  return cat.name_es ?? cat.name;
}

export function subcategoryDisplayName(
  sub: Pick<SubcategoryWithCount, "name" | "name_es">
) {
  return sub.name_es ?? sub.name;
}
