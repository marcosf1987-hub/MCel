import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProposePlaceForm } from "@/components/places/propose-place-form";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Agregar Local" };

export default async function ProposePlacePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?returnUrl=/locales/nuevo");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:max-w-2xl md:py-8">
      <Link
        href="/locales"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al mapa
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
        Agregar Local
      </h1>
      <div className="mt-6">
        <ProposePlaceForm />
      </div>
    </div>
  );
}
