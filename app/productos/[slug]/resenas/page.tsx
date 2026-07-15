import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewsList } from "@/components/product/reviews-list";
import type { ReviewCardData } from "@/components/product/review-card";
import { getRelation } from "@/lib/utils";

export const metadata = { title: "Todas las evaluaciones" };

export default async function ProductReviewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?returnUrl=/productos/${slug}/resenas`);

  const { data: product } = await supabase
    .from("products")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!product) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, opinion, general_description, taste, taste_rating, price_range,
      gluten_certification, created_at,
      profiles(display_name, tier)
    `
    )
    .eq("product_id", product.id)
    .is("deleted_at", null);

  const cards: ReviewCardData[] = (reviews ?? []).map((r) => {
    const profile = getRelation<{
      display_name: string | null;
      tier: ReviewCardData["tier"];
    }>(r.profiles);
    return {
      id: r.id,
      rating: r.rating,
      opinion: r.opinion,
      general_description: r.general_description,
      taste: r.taste,
      taste_rating: r.taste_rating ?? null,
      price_range: r.price_range,
      gluten_certification: r.gluten_certification,
      created_at: r.created_at,
      display_name: profile?.display_name ?? null,
      tier: profile?.tier ?? "none",
    };
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/productos/${slug}`}
        className="text-sm text-[var(--color-primary)] hover:underline"
      >
        ← Volver a {product.name}
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Evaluaciones de {product.name}</h1>
      <div className="mt-6">
        <ReviewsList reviews={cards} />
      </div>
    </div>
  );
}
