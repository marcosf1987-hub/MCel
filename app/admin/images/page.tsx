import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchReviewImages } from "@/lib/admin/catalog-server";
import { ImageReviewQueue } from "@/components/admin/image-review-queue";

export const metadata = { title: "Imágenes — Admin" };

export default async function AdminImagesPage() {
  const supabase = await createClient();
  const images = await fetchReviewImages(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
          Cola de imágenes
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Fotos marcadas como{" "}
          <code className="rounded bg-white px-1">needs_review</code> por el
          ranking automático. Podés aprobar portada, ocultar o descartar.
        </p>
      </div>

      <ImageReviewQueue initialImages={images} />

      <Link
        href="/admin"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← Volver al resumen
      </Link>
    </div>
  );
}
