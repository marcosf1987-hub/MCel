import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchAdminProducts } from "@/lib/admin/catalog-server";
import { CatalogProductsManager } from "@/components/admin/catalog-products-manager";

export const metadata = { title: "Productos — Admin" };

export default async function AdminCatalogProductsPage() {
  const supabase = await createClient();
  const products = await fetchAdminProducts(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
          Productos
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Editá datos del catálogo y gestioná productos ocultos.
        </p>
      </div>

      <CatalogProductsManager initialProducts={products} />

      <Link
        href="/admin/catalog"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← Volver al catálogo
      </Link>
    </div>
  );
}
