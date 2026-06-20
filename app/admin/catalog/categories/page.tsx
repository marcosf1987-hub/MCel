import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchAdminCategories } from "@/lib/admin/catalog-server";
import { CatalogCategoriesManager } from "@/components/admin/catalog-categories-manager";

export const metadata = { title: "Categorías — Admin" };

export default async function AdminCatalogCategoriesPage() {
  const supabase = await createClient();
  const categories = await fetchAdminCategories(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
          Categorías
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Categorías y subcategorías usadas al cargar productos.
        </p>
      </div>

      <CatalogCategoriesManager initialCategories={categories} />

      <Link
        href="/admin/catalog"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← Volver al catálogo
      </Link>
    </div>
  );
}
