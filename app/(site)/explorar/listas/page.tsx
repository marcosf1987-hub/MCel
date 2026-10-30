import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicListsExplore, type PublicListSort } from "@/lib/lists-server";
import { Card, CardContent } from "@/components/ui/card";
import { Compass, ListMusic, Bookmark, ThumbsUp } from "lucide-react";

export const metadata = { title: "Explorar listas" };

const SORT_OPTIONS: { value: PublicListSort; label: string }[] = [
  { value: "votes", label: "Más votadas" },
  { value: "saves", label: "Más guardadas" },
  { value: "recent", label: "Más recientes" },
];

export default async function ExploreListsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  const sort = (SORT_OPTIONS.some((o) => o.value === params.sort)
    ? params.sort
    : "votes") as PublicListSort;

  const supabase = await createClient();
  const lists = await getPublicListsExplore(supabase, { limit: 40, sort });

  return (
    <div className="mx-auto max-w-lg px-4 py-6 md:max-w-2xl md:py-8">
      <Link
        href="/explorar"
        className="mb-4 inline-block text-sm text-[var(--color-primary)] hover:underline"
      >
        ← Explorar
      </Link>
      <div className="mb-6 flex items-center gap-2">
        <ListMusic className="h-7 w-7 text-[var(--color-accent)]" />
        <h1 className="text-2xl font-bold text-[var(--color-brown)]">Listas de la comunidad</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/explorar/listas?sort=${opt.value}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sort === opt.value
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-secondary)] text-[var(--color-neutral)] hover:bg-[var(--color-brand-light)]"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {lists.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-[var(--color-border)]">
              {lists.map((list) => (
                <li key={list.id}>
                  {list.username ? (
                    <Link
                      href={`/listas/${list.username}/${list.slug}`}
                      className="block px-4 py-3.5 hover:bg-[var(--color-brand-cream)]"
                    >
                      <p className="font-medium text-[var(--color-brown)]">{list.title}</p>
                      {list.description && (
                        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)] line-clamp-2">
                          {list.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                        {list.display_name ?? list.username}
                      </p>
                      <p className="mt-1 flex gap-3 text-xs text-[var(--color-muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {list.vote_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bookmark className="h-3 w-3" />
                          {list.save_count}
                        </span>
                      </p>
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-sm text-[var(--color-muted-foreground)]">
          Todavía no hay listas públicas.{" "}
          <Link href="/cuenta/listas/nueva" className="font-medium text-[var(--color-primary)]">
            Creá la primera
          </Link>
        </p>
      )}

      <div className="mt-6 flex items-center gap-2 text-sm">
        <Compass className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        <Link href="/explorar" className="text-[var(--color-primary)] hover:underline">
          Volver a categorías
        </Link>
      </div>
    </div>
  );
}
