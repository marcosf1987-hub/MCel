import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "@/components/product/review-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Evaluar producto" };

export default async function EvaluateProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?returnUrl=/productos/${slug}/evaluar`);

  const { data: product } = await supabase
    .from("products")
    .select("id, slug, name, barcode")
    .eq("slug", slug)
    .single();

  if (!product) notFound();

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("product_id", product.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    redirect(`/productos/${slug}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Evaluar: {product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm
            productId={product.id}
            productSlug={product.slug}
            barcode={product.barcode}
          />
        </CardContent>
      </Card>
    </div>
  );
}
