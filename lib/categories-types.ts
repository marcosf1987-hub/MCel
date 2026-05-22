export type CategoryWithCount = {
  id: string;
  name: string;
  name_es: string | null;
  slug: string;
  product_count: number;
};

export type CategoriesNavData = {
  categories: CategoryWithCount[];
  totalProducts: number;
};

export function categoryDisplayName(cat: Pick<CategoryWithCount, "name" | "name_es">) {
  return cat.name_es ?? cat.name;
}
