import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrCreateFavoritesList, LIST_VISIBILITY_LABELS } from "@/lib/lists";
import { getCollaboratedListsSummary } from "@/lib/lists-server";
import { ListsDbSetupBanner } from "@/components/lists/lists-db-setup-banner";
import { Bookmark, ListMusic, Plus, Rss } from "lucide-react";
import type { ListVisibility } from "@/types/database";

export const metadata = { title: "Mis listas" };

export default async function MyListsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?returnUrl=/cuenta/listas");

  let lists;
  try {
    await getOrCreateFavoritesList(supabase, user.id);
    const { data, error } = await supabase
      .from("product_lists")
      .select("id, title, slug, description, visibility, is_system, vote_count, updated_at")
      .eq("user_id", user.id)
      .order("is_system", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) throw error;
    lists = data;

    try {
      collaborated = await getCollaboratedListsSummary(supabase, user.id);
    } catch {
      collaborated = [];
    }
  } catch (e) {
    console.error("MyListsPage:", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("product_lists") || msg.includes("schema cache")) {
      return <ListsDbSetupBanner />;
    }
    throw e;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--color-brown)]">
          <ListMusic className="h-7 w-7 text-[var(--color-accent)]" />
          Mis listas
        </h1>
        <Button asChild variant="accent" className="gap-2">
          <Link href="/cuenta/listas/nueva">
            <Plus className="h-4 w-4" />
            Nueva lista
          </Link>
        </Button>
      </div>

      <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
        Armá colecciones de productos, compartilas y recibí votos de la comunidad.
      </p>
      <p className="mb-6">
        <Link
          href="/cuenta/listas/guardadas"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          <Bookmark className="h-4 w-4" />
          Listas guardadas de otros usuarios
        </Link>
        {" · "}
        <Link href="/explorar/listas" className="text-sm text-[var(--color-muted-foreground)] hover:underline">
          Explorar listas públicas
        </Link>
        {" · "}
        <Link
          href="/cuenta/feed"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          <Rss className="h-4 w-4" />
          Feed
        </Link>
      </p>

      <ul className="space-y-3">
        {(lists ?? []).map((list) => (
          <li key={list.id}>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    <Link
                      href={`/cuenta/listas/${list.slug}`}
                      className="hover:text-[var(--color-primary)]"
                    >
                      {list.title}
                    </Link>
                  </CardTitle>
                  <span className="shrink-0 text-xs text-[var(--color-muted-foreground)]">
                    {LIST_VISIBILITY_LABELS[list.visibility as ListVisibility]}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-[var(--color-muted-foreground)]">
                  {list.vote_count} {list.vote_count === 1 ? "voto" : "votos"}
                </span>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/cuenta/listas/${list.slug}`}>Ver</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/cuenta/listas/${list.slug}/editar`}>Editar</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {collaborated.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-brown)]">
            Listas donde colaboro
          </h2>
          <ul className="space-y-3">
            {collaborated.map((list) => (
              <li key={list.id}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      <Link
                        href={`/cuenta/listas/${list.slug}`}
                        className="hover:text-[var(--color-primary)]"
                      >
                        {list.title}
                      </Link>
                    </CardTitle>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      De {list.ownerDisplayName ?? list.ownerUsername ?? "otro usuario"}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/cuenta/listas/${list.slug}/editar`}>Editar productos</Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!lists?.length && !collaborated.length && (
        <p className="text-center text-sm text-[var(--color-muted-foreground)]">
          Todavía no tenés listas.{" "}
          <Link href="/cuenta/listas/nueva" className="font-medium text-[var(--color-primary)]">
            Creá la primera
          </Link>
        </p>
      )}
    </div>
  );
}
