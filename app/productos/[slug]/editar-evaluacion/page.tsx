import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "@/components/product/review-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Editar evaluación" };

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?returnUrl=/productos/${slug}/editar-evaluacion`);

  const { data: product } = await supabase
    .from("products")
    .select("id, slug, name, barcode")
    .eq("slug", slug)
    .single();

  if (!product) notFound();

  const { data: review } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", product.id)
    .eq("user_id", user.id)
    .single();

  if (!review) redirect(`/productos/${slug}/evaluar`);

  const { count: imageCount } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", product.id);

  const { data: userImages } = await supabase
    .from("product_images")
    .select("id, url")
    .eq("product_id", product.id)
    .eq("user_id", user.id)
    .order("sort_order");

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Editar evaluación: {product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm
            mode="edit"
            reviewId={review.id}
            productId={product.id}
            productSlug={product.slug}
            barcode={product.barcode}
            hasExistingImages={(imageCount ?? 0) > 0}
            initialValues={{
              rating: review.rating,
              generalDescription: review.general_description,
              taste: review.taste ?? "",
              priceRange: review.price_range,
              opinion: review.opinion,
              glutenCertification: review.gluten_certification,
            }}
            userImages={userImages ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
