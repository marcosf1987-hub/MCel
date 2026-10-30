/**
 * Política de Image Optimization (Vercel):
 *
 * El plan Pro incluye 5.000 transformaciones/mes. Con catálogo + home + retina
 * se agotaba en ~2 semanas. Por eso las fotos remotas NO pasan por el
 * optimizador de Vercel (`unoptimized`): se sirven directo desde Supabase /
 * Open Food Facts (ya comprimidas al subir, máx ~1200px).
 *
 * `sizes` sigue alineado a next.config por si en el futuro se reactiva
 * la optimización de forma selectiva.
 */
export function nextImageUnoptimized(src: string | null | undefined): boolean {
  if (!src) return true;
  // Remotas: no cuentan contra el cupo de Image Transformations.
  if (/^https?:\/\//i.test(src)) return true;
  return false;
}

/** Anchos sugeridos (coinciden con next.config images.imageSizes / deviceSizes). */
export const IMAGE_SIZE = {
  thumbSm: "96px",
  thumbMd: "128px",
  card: "256px",
  hero: "256px",
  gallery: "640px",
} as const;
