import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchAdminPlaces } from "@/lib/places-server";
import { CatalogPlacesManager } from "@/components/admin/catalog-places-manager";

export const metadata = { title: "Locales — Admin" };

export default async function AdminCatalogPlacesPage() {
  const supabase = await createClient();
  const places = await fetchAdminPlaces(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
          Locales
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Buscá en Google Places para prellenar, o cargá a mano. Solo admin.
        </p>
      </div>

      <CatalogPlacesManager initialPlaces={places} />

      <Link
        href="/admin/catalog"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← Volver al catálogo
      </Link>
    </div>
  );
}
