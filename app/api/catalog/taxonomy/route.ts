import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import {
  sortTaxonomyCategories,
  type TaxonomyCategory,
} from "@/lib/catalog-taxonomy";

export async function GET() {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase no configurado." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("categories")
    .select(
      "id, name, name_es, slug, subcategories(id, name, name_es, slug, category_id)"
    )
    .eq("is_system", true)
    .order("name");

  if (error) {
    if (error.message.includes("is_system")) {
      const { data: fallback, error: fbErr } = await supabase
        .from("categories")
        .select(
          "id, name, name_es, slug, subcategories(id, name, name_es, slug, category_id)"
        )
        .order("name");
      if (fbErr) {
        return NextResponse.json({ ok: false, error: fbErr.message }, { status: 500 });
      }
      const categories = sortTaxonomyCategories(
        (fallback ?? []) as TaxonomyCategory[]
      );
      return NextResponse.json(
        { ok: true, categories },
        {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        }
      );
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const categories = sortTaxonomyCategories((data ?? []) as TaxonomyCategory[]);

  return NextResponse.json(
    { ok: true, categories },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
