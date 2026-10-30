import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserSavedLists } from "@/lib/lists-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, ThumbsUp } from "lucide-react";

export const metadata = { title: "Listas guardadas" };

export default async function SavedListsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?returnUrl=/cuenta/listas/guardadas");

  const saved = await getUserSavedLists(supabase, user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/cuenta/listas"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          ← Mis listas
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-[var(--color-brown)]">
          <Bookmark className="h-7 w-7 text-[var(--color-accent)]" />
          Listas guardadas
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Colecciones de otros usuarios que guardaste para volver después.
        </p>
      </div>

      {saved.length > 0 ? (
        <ul className="space-y-3">
          {saved.map((list) => (
            <li key={list.id}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {list.username ? (
                      <Link
                        href={`/listas/${list.username}/${list.slug}`}
                        className="hover:text-[var(--color-primary)]"
                      >
                        {list.title}
                      </Link>
                    ) : (
                      list.title
                    )}
                  </CardTitle>
                  {list.display_name && list.username && (
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      por{" "}
                      <Link href={`/perfil/${list.username}`} className="hover:underline">
                        {list.display_name}
                      </Link>
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-[var(--color-muted-foreground)]">
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {list.vote_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark className="h-3.5 w-3.5" />
                      {list.save_count}
                    </span>
                  </span>
                  {list.username && (
                    <Link
                      href={`/listas/${list.username}/${list.slug}`}
                      className="font-medium text-[var(--color-primary)] hover:underline"
                    >
                      Abrir
                    </Link>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-brand-cream)] p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          <p>Todavía no guardaste listas.</p>
          <Link href="/explorar/listas" className="mt-2 inline-block font-medium text-[var(--color-primary)] hover:underline">
            Explorar listas de la comunidad →
          </Link>
        </div>
      )}
    </div>
  );
}
