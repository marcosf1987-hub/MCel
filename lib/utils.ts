import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Supabase puede devolver relaciones FK como objeto o como array. */
export function getBrandName(brands: unknown): string | undefined {
  if (!brands) return undefined;
  if (Array.isArray(brands)) {
    return (brands[0] as { name?: string } | undefined)?.name;
  }
  return (brands as { name?: string }).name;
}

export function getBrand(brands: unknown): { name: string; slug: string } | null {
  if (!brands) return null;
  const row = Array.isArray(brands) ? brands[0] : brands;
  if (!row || typeof row !== "object") return null;
  const b = row as { name?: string; slug?: string };
  if (!b.name || !b.slug) return null;
  return { name: b.name, slug: b.slug };
}

/** Extrae el primer registro de una relación Supabase (objeto o array). */
export function getRelation<T>(rel: unknown): T | null {
  if (!rel) return null;
  const row = Array.isArray(rel) ? rel[0] : rel;
  return (row as T) ?? null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
