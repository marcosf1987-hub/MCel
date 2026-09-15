/**
 * Política de Image Optimization (Vercel):
 * - Usar `sizes` fijos alineados a `imageSizes` / `deviceSizes` de next.config
 *   para no generar docenas de anchos distintos.
 * - Open Food Facts: `unoptimized` (ya vienen redimensionadas).
 * - Thumbs ≤128px visuales: preferir sizes="96px" | "128px".
 * - Carruseles / cards: sizes="256px".
 * - Heroes: sizes="300px" o similar fijo.
 */
export function nextImageUnoptimized(src: string | null | undefined): boolean {
  if (!src) return true;
  return src.includes("openfoodfacts");
}

/** Anchos sugeridos (coinciden con next.config images.imageSizes / deviceSizes). */
export const IMAGE_SIZE = {
  thumbSm: "96px",
  thumbMd: "128px",
  card: "256px",
  hero: "300px",
} as const;
