/** Imágenes visibles ordenadas por sort_order (portada primero). */
export function visibleProductImages<
  T extends { sort_order: number; is_hidden?: boolean | null },
>(images: T[] | null | undefined): T[] {
  return (images ?? [])
    .filter((img) => img.is_hidden !== true)
    .sort((a, b) => a.sort_order - b.sort_order);
}
