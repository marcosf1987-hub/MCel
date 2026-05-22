import Link from "next/link";
import { getCategoriesNavData } from "@/lib/categories-cache";
import { categoryDisplayName } from "@/lib/categories-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass } from "lucide-react";

export const metadata = { title: "Explorar" };

export default async function ExplorePage() {
  const data = await getCategoriesNavData();

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:max-w-2xl md:py-8">
      <div className="mb-6 flex items-center gap-2">
        <Compass className="h-7 w-7 text-[var(--color-accent)]" />
        <h1 className="text-2xl font-bold text-[var(--color-brown)]">Explorar</h1>
      </div>
      <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
        Elegí una categoría para ver productos evaluados por la comunidad.
      </p>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Categorías</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-[var(--color-border)]">
            <li>
              <Link
                href="/productos"
                className="flex items-center justify-between px-4 py-3.5 hover:bg-[var(--color-brand-cream)]"
              >
                <span className="font-medium text-[var(--color-brown)]">
                  Todas las categorías
                </span>
                <span className="text-sm text-[var(--color-muted-foreground)]">
                  {data.totalProducts} productos
                </span>
              </Link>
            </li>
            {data.categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/categorias/${cat.slug}`}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-[var(--color-brand-cream)]"
                >
                  <span className="text-[var(--color-brown)]">
                    {categoryDisplayName(cat)}
                  </span>
                  <span className="text-sm text-[var(--color-muted-foreground)]">
                    ({cat.product_count})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-[var(--color-border)] px-4 py-3">
            <Link
              href="/marcas"
              className="text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Ver todas las marcas →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
