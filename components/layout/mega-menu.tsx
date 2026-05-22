import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function MegaMenu() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, name_es, slug, subcategories(id, name, name_es, slug)")
    .order("name")
    .limit(8);

  return (
    <nav className="hidden md:flex items-center gap-4 text-sm">
      <Link href="/productos" className="hover:text-[var(--color-primary)]">
        Productos
      </Link>
      <Link href="/marcas" className="hover:text-[var(--color-primary)]">
        Marcas
      </Link>
      <div className="group relative">
        <span className="cursor-pointer hover:text-[var(--color-primary)]">Categorías</span>
        <div className="invisible absolute left-0 top-full z-50 min-w-[320px] rounded-lg border bg-white p-4 shadow-lg group-hover:visible">
          <div className="grid gap-4 sm:grid-cols-2">
            {(categories ?? []).map((cat) => (
              <div key={cat.id}>
                <Link
                  href={`/categorias/${cat.slug}`}
                  className="font-medium text-[var(--color-primary)] hover:underline"
                >
                  {cat.name_es ?? cat.name}
                </Link>
                <ul className="mt-1 space-y-0.5">
                  {((cat.subcategories as { id: string; name: string; name_es: string | null; slug: string }[]) ?? [])
                    .slice(0, 4)
                    .map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/subcategorias/${sub.slug}?cat=${cat.slug}`}
                          className="text-xs text-[var(--color-muted-foreground)] hover:underline"
                        >
                          {sub.name_es ?? sub.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
