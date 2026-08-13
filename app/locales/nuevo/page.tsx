import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProposePlaceForm } from "@/components/places/propose-place-form";

export const metadata = { title: "Proponer local" };

export default async function ProposePlacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnUrl=/locales/nuevo");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-8">
      <Link
        href="/locales"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← Volver al mapa
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
        Proponer un local
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Completá ubicación e info celíaca. Un moderador lo revisará antes de
        publicarlo en el mapa.
      </p>
      <div className="mt-6">
        <ProposePlaceForm />
      </div>
    </div>
  );
}
