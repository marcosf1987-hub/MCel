import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductCardGrid } from "@/components/product/product-card-grid";
import { ProductListToolbar } from "@/components/product/product-list-toolbar";
import {
  fetchFilteredProducts,
  mapProductToCard,
  type ProductListParams,
} from "@/lib/product-list-filters";
import { getBrandName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export const metadata = { title: "Mis favoritos" };

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<ProductListParams & { favSort?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?returnUrl=/cuenta/favoritos");

  const { data: favorites } = await supabase
    .from("favorites")
    .select("product_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: params.favSort === "oldest" });

  const productIds = (favorites ?? []).map((f) => f.product_id);

  const filterParams: ProductListParams = {
    q: params.q,
    cert: params.cert,
    minRating: params.minRating,
    sort: params.sort,
  };

  const defaultOrder =
    params.favSort === "oldest"
      ? { column: "created_at", ascending: true }
      : { column: "review_count", ascending: false };

  const products = await fetchFilteredProducts(
    supabase,
    productIds,
    filterParams,
    defaultOrder
  );

  // Re-sort by favorite date when no other sort
  let ordered = products;
  if (!params.sort && favorites?.length) {
    const orderMap = new Map(
      favorites.map((f, i) => [f.product_id, i])
    );
    ordered = [...products].sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
    );
    if (params.favSort === "oldest") {
      ordered = [...ordered].reverse();
    }
  }

  const cards = ordered.map((p) => mapProductToCard(p, getBrandName));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--color-brown)]">
            <Heart className="h-7 w-7 fill-red-500 text-red-500" />
            Mis favoritos
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {cards.length} producto{cards.length !== 1 ? "s" : ""} guardado
            {cards.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/cuenta/preferencias">Mi cuenta</Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <ProductListToolbar showSort />
      </Suspense>

      <div className="mb-4 flex gap-2 text-sm">
        <Link
          href="/cuenta/favoritos"
          className={
            !params.favSort
              ? "font-semibold text-[var(--color-accent)]"
              : "text-[var(--color-muted-foreground)] hover:underline"
          }
        >
          Más recientes
        </Link>
        <span className="text-[var(--color-muted-foreground)]">·</span>
        <Link
          href="/cuenta/favoritos?favSort=oldest"
          className={
            params.favSort === "oldest"
              ? "font-semibold text-[var(--color-accent)]"
              : "text-[var(--color-muted-foreground)] hover:underline"
          }
        >
          Más antiguos
        </Link>
      </div>

      {params.q && (
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
          Resultados para: {params.q}
        </p>
      )}

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-brand-cream)] p-8 text-center">
          <p className="text-[var(--color-muted-foreground)]">
            {productIds.length === 0
              ? "Todavía no guardaste favoritos. Tocá el corazón en cualquier ficha de producto."
              : "Ningún favorito coincide con los filtros."}
          </p>
          <Button asChild className="mt-4" variant="accent">
            <Link href="/productos">Explorar productos</Link>
          </Button>
        </div>
      ) : (
        <ProductCardGrid products={cards} isLoggedIn favoriteIds={new Set(productIds)} />
      )}
    </div>
  );
}
