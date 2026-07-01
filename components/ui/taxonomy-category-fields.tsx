"use client";

import {
  sortTaxonomyCategories,
  type TaxonomyCategory,
  type TaxonomySelection,
} from "@/lib/catalog-taxonomy";
import { SearchableSelect } from "@/components/ui/searchable-select";

type TaxonomyCategoryFieldsProps = {
  categories: TaxonomyCategory[];
  value: TaxonomySelection | null;
  onChange: (value: TaxonomySelection | null) => void;
  disabled?: boolean;
};

export function TaxonomyCategoryFields({
  categories,
  value,
  onChange,
  disabled = false,
}: TaxonomyCategoryFieldsProps) {
  const sorted = sortTaxonomyCategories(categories);

  const categoryOptions = sorted.map((cat) => ({
    value: cat.id,
    label: cat.name_es ?? cat.name,
    searchText: `${cat.name_es ?? cat.name} ${cat.slug}`,
  }));

  const selectedCategory = sorted.find((c) => c.id === value?.categoryId);

  const subcategoryOptions = (selectedCategory?.subcategories ?? []).map((sub) => ({
    value: sub.id,
    label: sub.name_es ?? sub.name,
    searchText: `${sub.name_es ?? sub.name} ${sub.slug}`,
  }));

  const handleCategoryChange = (categoryId: string) => {
    onChange({ categoryId, subcategoryId: "" });
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    if (!value?.categoryId) return;
    onChange({ categoryId: value.categoryId, subcategoryId });
  };

  return (
    <div className="space-y-4">
      <SearchableSelect
        label="Categoría *"
        options={categoryOptions}
        value={value?.categoryId ?? null}
        onChange={handleCategoryChange}
        disabled={disabled}
        placeholder="Elegí o buscá categoría…"
        emptyMessage="No hay categorías que coincidan."
      />
      <SearchableSelect
        label="Subcategoría *"
        options={subcategoryOptions}
        value={value?.subcategoryId ?? null}
        onChange={handleSubcategoryChange}
        disabled={disabled || !value?.categoryId}
        placeholder={
          value?.categoryId
            ? "Elegí o buscá subcategoría…"
            : "Primero elegí una categoría"
        }
        emptyMessage="No hay subcategorías que coincidan en esta categoría."
      />
    </div>
  );
}
