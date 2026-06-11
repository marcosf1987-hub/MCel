import Link from "next/link";
import { ArrowRight, ListMusic, ThumbsUp } from "lucide-react";
import type { HomePageData } from "@/lib/home-server";

export function TopListsSection({
  lists,
}: {
  lists: HomePageData["topLists"];
}) {
  if (!lists.length) return null;

  return (
    <section className="mb-10 md:mb-14">
      <div className="mb-4 flex items-end justify-between gap-4 md:mb-6">
        <h2 className="font-[family-name:var(--font-headline)] text-xl font-bold italic text-[var(--color-brown)] md:text-2xl">
          Listas destacadas
        </h2>
        <Link
          href="/explorar/listas"
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral)] hover:text-[var(--color-primary)]"
        >
          Ver todas las listas
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={
              list.username ? `/listas/${list.username}/${list.slug}` : "/explorar/listas"
            }
            className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-2 text-[var(--color-primary)]">
              <ListMusic className="h-4 w-4" />
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {list.display_name ?? list.username ?? "Comunidad"}
              </span>
            </div>
            <h3 className="font-[family-name:var(--font-headline)] text-lg font-semibold text-[var(--color-brown)]">
              {list.title}
            </h3>
            {list.description && (
              <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted-foreground)]">
                {list.description}
              </p>
            )}
            <p className="mt-3 flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
              <ThumbsUp className="h-3.5 w-3.5" />
              {list.vote_count} {list.vote_count === 1 ? "voto" : "votos"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
