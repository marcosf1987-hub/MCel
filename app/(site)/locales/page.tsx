import { createClient } from "@/lib/supabase/server";
import { fetchPublicPlaces } from "@/lib/places-server";
import { LocalesExplorer } from "@/components/places/locales-explorer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export const metadata = {
  title: "Mapa de locales",
  description:
    "Mapa de comercios y restaurantes con opciones sin TACC en CeliApp.",
};

export default async function LocalesPage() {
  const supabase = await createClient();
  const places = await fetchPublicPlaces(supabase);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-3 md:pb-8 md:pt-8">
      <div className="mb-5 hidden flex-wrap items-end justify-between gap-3 md:flex">
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-headline)] text-3xl font-bold text-[var(--color-brown)]">
            Locales
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-muted-foreground)]">
            Comercios y restaurantes con opciones para celíacos cerca tuyo.
          </p>
        </div>
        <Button asChild variant="accent" size="sm">
          <Link href="/locales/nuevo" className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            Agregar Local
          </Link>
        </Button>
      </div>

      <LocalesExplorer places={places} />
    </div>
  );
}
