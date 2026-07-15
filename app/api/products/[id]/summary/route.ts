import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { summarizeReviews } from "@/lib/ai/summarize";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("opinion, taste, taste_rating, price_range")
    .eq("product_id", id)
    .is("deleted_at", null);

  if (!reviews?.length) {
    return NextResponse.json({ summary: null });
  }

  const summary = await summarizeReviews(reviews);

  await supabase
    .from("products")
    .update({ ai_summary: summary })
    .eq("id", id);

  return NextResponse.json({ summary });
}
