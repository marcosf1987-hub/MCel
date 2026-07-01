import type { SupabaseClient } from "@supabase/supabase-js";

export async function validateCategoryPair(
  supabase: SupabaseClient,
  categoryId: string,
  subcategoryId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!categoryId || !subcategoryId) {
    return { ok: false, error: "Elegí categoría y subcategoría del listado." };
  }

  const { data: sub } = await supabase
    .from("subcategories")
    .select("id, category_id")
    .eq("id", subcategoryId)
    .maybeSingle();

  if (!sub) {
    return { ok: false, error: "Subcategoría inválida." };
  }

  if (sub.category_id !== categoryId) {
    return {
      ok: false,
      error: "La subcategoría no corresponde a la categoría elegida.",
    };
  }

  return { ok: true };
}
