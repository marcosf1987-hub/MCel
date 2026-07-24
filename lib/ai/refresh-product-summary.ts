import type { SupabaseClient } from "@supabase/supabase-js";
import { summarizeReviews } from "@/lib/ai/summarize";

/** Genera y guarda resumen AI si aún no existe (o force). */
export async function refreshProductAiSummary(
  supabase: SupabaseClient,
  productId: string,
  options: { force?: boolean } = {}
): Promise<{ summary: string | null; cached?: boolean; error?: string }> {
  const { data: product } = await supabase
    .from("products")
    .select("id, ai_summary")
    .eq("id", productId)
    .maybeSingle();

  if (!product) return { summary: null, error: "not_found" };

  if (product.ai_summary && !options.force) {
    return { summary: product.ai_summary, cached: true };
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("opinion, taste, taste_rating, price_range")
    .eq("product_id", productId)
    .is("deleted_at", null);

  if (!reviews?.length) return { summary: null };

  const summary = await summarizeReviews(reviews);
  const { error } = await supabase.rpc("set_product_ai_summary", {
    p_product_id: productId,
    p_summary: summary,
  });

  if (error) {
    console.error("set_product_ai_summary:", error.message);
    return { summary: null, error: error.message };
  }

  return { summary };
}
