import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/utils";

export async function resolveUniquePlaceSlug(
  supabase: SupabaseClient,
  name: string,
  excludePlaceId?: string
): Promise<string> {
  const base = slugify(name) || "local";
  let candidate = base;
  let n = 0;

  while (true) {
    let query = supabase.from("places").select("id").eq("slug", candidate);
    if (excludePlaceId) query = query.neq("id", excludePlaceId);
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

export function parseCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.trim().replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function isValidLat(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

export function isValidLng(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}
