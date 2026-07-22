import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchCatalogSuggestions } from "@/lib/search/catalog";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();
  const suggestions = await searchCatalogSuggestions(supabase, q, 12);

  if (suggestions) {
    return NextResponse.json({ results: suggestions });
  }

  // Fallback si la RPC aún no está aplicada
  const pattern = `%${q}%`;
  const results: { type: string; label: string; href: string }[] = [];

  const [brands, categories, subcategories, products] = await Promise.all([
    supabase.from("brands").select("name, slug").ilike("name", pattern).limit(3),
    supabase.from("categories").select("name, name_es, slug").ilike("name", pattern).limit(3),
    supabase.from("subcategories").select("name, name_es, slug").ilike("name", pattern).limit(3),
    supabase.from("products").select("name, slug").ilike("name", pattern).limit(5),
  ]);

  for (const b of brands.data ?? []) {
    results.push({ type: "Marca", label: b.name, href: `/marcas/${b.slug}` });
  }
  for (const c of categories.data ?? []) {
    results.push({
      type: "Categoría",
      label: c.name_es ?? c.name,
      href: `/categorias/${c.slug}`,
    });
  }
  for (const s of subcategories.data ?? []) {
    results.push({
      type: "Subcategoría",
      label: s.name_es ?? s.name,
      href: `/subcategorias/${s.slug}`,
    });
  }
  for (const p of products.data ?? []) {
    results.push({ type: "Producto", label: p.name, href: `/productos/${p.slug}` });
  }

  return NextResponse.json({ results: results.slice(0, 12) });
}
