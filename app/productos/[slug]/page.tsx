import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCarousel } from "@/components/product/product-carousel";
import { StarRating } from "@/components/product/star-rating";
import { ReviewCard, type ReviewCardData } from "@/components/product/review-card";
import { ReportButton } from "@/components/product/report-button";
import { Button } from "@/components/ui/button";
import { GLUTEN_LABELS } from "@/lib/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name")
    .eq("slug", slug)
    .single();
  return { title: data?.name ?? "Producto" };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: product } = await supabase
    .from("products")
    .select(
      `
      *,
      brands(name, slug),
      categories(name, name_es, slug),
      subcategories(name, name_es, slug),
      product_images(id, url, sort_order)
    `
    )
    .eq("slug", slug)
    .single();

  if (!product) notFound();

  const images = ((product.product_images as { id: string; url: string; sort_order: number }[]) ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  let latestReview: ReviewCardData | null = null;

  const { data: latestRows } = await supabase.rpc("get_latest_review", {
    p_product_id: product.id,
  });

  if (latestRows?.[0]) {
    const r = latestRows[0];
    latestReview = {
      id: r.id,
      rating: r.rating,
      opinion: r.opinion,
      general_description: r.general_description,
      taste: r.taste,
      price: r.price,
      gluten_certification: r.gluten_certification,
      created_at: r.created_at,
      display_name: r.display_name,
      tier: r.tier,
    };
  }

  const brand = product.brands as { name: string; slug: string };
  const category = product.categories as { name: string; name_es: string | null; slug: string };
  const subcategory = product.subcategories as { name: string; name_es: string | null; slug: string };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductCarousel images={images} />

        <div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            <Link href={`/marcas/${brand.slug}`} className="hover:underline">
              {brand.name}
            </Link>
            {" · "}
            <Link href={`/categorias/${category.slug}`} className="hover:underline">
              {category.name_es ?? category.name}
            </Link>
            {" · "}
            <Link
              href={`/subcategorias/${subcategory.slug}?cat=${category.slug}`}
              className="hover:underline"
            >
              {subcategory.name_es ?? subcategory.name}
            </Link>
          </p>
          <h1 className="mt-2 text-2xl font-bold">{product.name}</h1>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Código: {product.barcode}
          </p>

          <div className="mt-4">
            <StarRating value={product.weighted_rating} size="lg" />
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {product.review_count} evaluación{product.review_count !== 1 ? "es" : ""} · Promedio
              ponderado por nivel de colaborador
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {user ? (
              <Button asChild>
                <Link href={`/productos/${slug}/evaluar`}>Evaluar producto</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/login?returnUrl=/productos/${slug}/evaluar`}>
                  Iniciar sesión para evaluar
                </Link>
              </Button>
            )}
            <ReportButton targetType="product" targetId={product.id} />
          </div>
        </div>
      </div>

      {product.ai_summary && (
        <section className="mt-8 rounded-lg border bg-[var(--color-accent)] p-6">
          <h2 className="font-semibold text-[var(--color-primary)]">Resumen de la comunidad</h2>
          <p className="mt-2 text-sm leading-relaxed">{product.ai_summary}</p>
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            Generado a partir de las evaluaciones sobre descripción, sabor y precio.
          </p>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Última evaluación</h2>
          {product.review_count > 1 && (
            user ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/productos/${slug}/resenas`}>Ver todas las evaluaciones</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={`/login?returnUrl=/productos/${slug}/resenas`}>
                  Ver más evaluaciones (requiere login)
                </Link>
              </Button>
            )
          )}
        </div>

        {latestReview ? (
          <ReviewCard review={latestReview} />
        ) : (
          <p className="text-[var(--color-muted-foreground)]">
            Sin evaluaciones aún. ¡Sé el primero!
          </p>
        )}
      </section>
    </div>
  );
}
