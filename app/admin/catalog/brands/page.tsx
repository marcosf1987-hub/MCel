import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchAdminBrands } from "@/lib/admin/catalog-server";
import { CatalogBrandsManager } from "@/components/admin/catalog-brands-manager";

export const metadata = { title: "Marcas — Admin" };

export default async function AdminCatalogBrandsPage() {
  const supabase = await createClient();
  const brands = await fetchAdminBrands(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
          Marcas
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Alta y edición de marcas del catálogo.
        </p>
      </div>

      <CatalogBrandsManager initialBrands={brands} />

      <Link
        href="/admin/catalog"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← Volver al catálogo
      </Link>
    </div>
  );
}
