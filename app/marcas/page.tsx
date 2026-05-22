import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Marcas" };

export default async function BrandsPage() {
  const supabase = await createClient();
  const { data: brands } = await supabase
    .from("brands")
    .select("name, slug")
    .order("name");

  const grouped: Record<string, typeof brands> = {};
  for (const b of brands ?? []) {
    const letter = b.name[0]?.toUpperCase() ?? "#";
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter]!.push(b);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Marcas</h1>
      <div className="space-y-8">
        {Object.keys(grouped)
          .sort()
          .map((letter) => (
            <section key={letter}>
              <h2 className="mb-3 font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-accent)]">
                {letter}
              </h2>
              <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                {grouped[letter]!.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/marcas/${b.slug}`}
                    className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-brown)] hover:bg-[var(--color-brand-cream)] hover:border-[var(--color-brand-light)]"
                  >
                    {b.name}
                  </Link>
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
