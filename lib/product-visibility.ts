/** Estado de catálogo visible solo a staff (RLS permite ver soft-deleted). */
export type CatalogVisibilityBadge = {
  label: "Fusionado" | "Oculto";
  className: string;
};

export function getCatalogVisibilityBadge(product: {
  deleted_at?: string | null;
  slug?: string | null;
  barcode?: string | null;
}): CatalogVisibilityBadge | null {
  if (!product.deleted_at) return null;

  const slug = product.slug ?? "";
  const barcode = product.barcode ?? "";
  const merged =
    slug.startsWith("merged-") || barcode.startsWith("merged-");

  if (merged) {
    return {
      label: "Fusionado",
      className: "bg-amber-700 text-white",
    };
  }

  return {
    label: "Oculto",
    className: "bg-stone-600 text-white",
  };
}
