import { createClient } from "@/lib/supabase/server";
import { fetchPublicPlaces } from "@/lib/places-server";
import { LocalesExplorer } from "@/components/places/locales-explorer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Store } from "lucide-react";

export const metadata = {
  title: "Locales",
  description:
    "Mapa de comercios y restaurantes con opciones sin TACC en CeliApp.",
};

export default async function LocalesPage() {
  const supabase = await createClient();
  const places = await fetchPublicPlaces(supabase);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Store className="mt-0.5 h-7 w-7 shrink-0 text-[var(--color-accent)]" />
          <div>
            <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
              Locales
            </h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              Comercios y restaurantes con opciones para celíacos. Filtrá, usá
              “Cerca mío” o tocá un marcador para ver la ficha.
            </p>
          </div>
        </div>
        <Button asChild variant="accent" size="sm">
          <Link href="/locales/nuevo" className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            Proponer local
          </Link>
        </Button>
      </div>

      <LocalesExplorer places={places} />
    </div>
  );
}
