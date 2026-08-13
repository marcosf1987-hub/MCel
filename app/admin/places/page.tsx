import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchPendingPlaces } from "@/lib/places-server";
import { PlacesPendingQueue } from "@/components/admin/places-pending-queue";

export const metadata = { title: "Locales pendientes — Admin" };

export default async function AdminPlacesPendingPage() {
  const supabase = await createClient();
  const places = await fetchPendingPlaces(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
          Locales pendientes
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Propuestas de la comunidad. Publicá o rechazá con un motivo.
        </p>
      </div>

      <PlacesPendingQueue initialPlaces={places} />

      <Link
        href="/admin"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← Volver al resumen
      </Link>
    </div>
  );
}
