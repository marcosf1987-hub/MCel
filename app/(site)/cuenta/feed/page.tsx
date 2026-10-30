import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getFollowingFeedLists } from "@/lib/lists-server";
import type { FeedSort } from "@/lib/list-feed-score";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedSortToggle } from "@/components/lists/feed-sort-toggle";
import { Rss } from "lucide-react";

export const metadata = { title: "Feed de listas" };

export default async function ListsFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  const sort: FeedSort = params.sort === "recent" ? "recent" : "relevant";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?returnUrl=/cuenta/feed");

  let feed;
  try {
    feed = await getFollowingFeedLists(supabase, user.id, { sort });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (
      msg.includes("user_follows") ||
      msg.includes("schema cache") ||
      msg.includes("list_notifications")
    ) {
      return (
        <div className="mx-auto max-w-lg px-4 py-8 text-sm text-[var(--color-muted-foreground)]">
          <p>
            Falta aplicar la migración{" "}
            <code className="text-xs">009_lists_phase3_social.sql</code> o{" "}
            <code className="text-xs">016_lists_phase4_social.sql</code> en Supabase.
          </p>
          <Link href="/cuenta/listas" className="mt-4 inline-block font-medium text-[var(--color-primary)]">
            ← Mis listas
          </Link>
        </div>
      );
    }
    throw e;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--color-brown)]">
            <Rss className="h-7 w-7 text-[var(--color-accent)]" />
            Feed de listas
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Listas de personas que seguís, ordenadas por{" "}
            {sort === "relevant" ? "relevancia" : "fecha"}.
          </p>
        </div>
        <Suspense fallback={null}>
          <FeedSortToggle current={sort} />
        </Suspense>
      </div>

      {feed.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Seguí usuarios desde su perfil para ver sus listas acá.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {feed.map((item) => (
            <li key={item.id}>
              <Card>
                <CardHeader className="pb-2">
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {item.display_name ?? item.username}
                  </p>
                  <CardTitle className="text-base">
                    {item.username ? (
                      <Link
                        href={`/listas/${item.username}/${item.slug}`}
                        className="hover:text-[var(--color-primary)]"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-[var(--color-muted-foreground)]">
                  {item.description && <p className="mb-2 line-clamp-2">{item.description}</p>}
                  <span>
                    👍 {item.vote_count} · 👎 {item.downvote_count} · {item.save_count} guardados
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
