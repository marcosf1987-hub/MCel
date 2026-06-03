import Link from "next/link";
import { getCategoriesNavData } from "@/lib/categories-cache";
import { categoryDisplayName } from "@/lib/categories-types";
import { getTopPublicLists } from "@/lib/lists-server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, ListMusic, ThumbsUp } from "lucide-react";

export const metadata = { title: "Explorar" };

export default async function ExplorePage() {
  const data = await getCategoriesNavData();
  const supabase = await createClient();
  const topLists = await getTopPublicLists(supabase, 5);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:max-w-2xl md:py-8">
      <div className="mb-6 flex items-center gap-2">
        <Compass className="h-7 w-7 text-[var(--color-accent)]" />
        <h1 className="text-2xl font-bold text-[var(--color-brown)]">Explorar</h1>
      </div>
      <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
        Elegí una categoría o descubrí listas curadas por la comunidad.
      </p>

      {topLists.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListMusic className="h-5 w-5 text-[var(--color-accent)]" />
              Listas más votadas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-[var(--color-border)]">
              {topLists.map((list) => (
                <li key={list.id}>
                  {list.username ? (
                    <Link
                      href={`/listas/${list.username}/${list.slug}`}
                      className="flex items-center justify-between gap-2 px-4 py-3.5 hover:bg-[var(--color-brand-cream)]"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--color-brown)] truncate">
                          {list.title}
                        </p>
                        {list.description && (
                          <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-1">
                            {list.description}
                          </p>
                        )}
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          por {list.display_name ?? list.username}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-sm text-[var(--color-muted-foreground)]">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {list.vote_count}
                      </span>
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="border-t border-[var(--color-border)] px-4 py-3">
              <Link
                href="/cuenta/listas/nueva"
                className="text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                Crear tu lista →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

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
