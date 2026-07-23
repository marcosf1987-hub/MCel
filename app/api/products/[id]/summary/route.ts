import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session-profile";
import { summarizeReviews } from "@/lib/ai/summarize";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "1";
  if (force) {
    const auth = await requireRole(supabase, "moderator");
    if (!auth.ok) {
      return NextResponse.json(
        { error: "Sin permisos para regenerar el resumen." },
        { status: 403 }
      );
    }
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, ai_summary")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  if (product.ai_summary && !force) {
    return NextResponse.json({ summary: product.ai_summary, cached: true });
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("opinion, taste, taste_rating, price_range")
    .eq("product_id", id)
    .is("deleted_at", null);

  if (!reviews?.length) {
    return NextResponse.json({ summary: null });
  }

  const summary = await summarizeReviews(reviews);

  const { error } = await supabase.rpc("set_product_ai_summary", {
    p_product_id: id,
    p_summary: summary,
  });

  if (error) {
    console.error("set_product_ai_summary:", error.message);
    return NextResponse.json(
      { error: "No se pudo guardar el resumen." },
      { status: 500 }
    );
  }

  return NextResponse.json({ summary });
}
