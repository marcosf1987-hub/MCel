import { notFound, redirect } from "next/navigation";
import { getEditableListBySlug } from "@/lib/lists-server";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductCardGrid } from "@/components/product/product-card-grid";
import { ProductListToolbar } from "@/components/product/product-list-toolbar";
import { getListProductCards } from "@/lib/lists-server";
import { getProductCardAuthContext } from "@/lib/product-card-auth";
import { LIST_VISIBILITY_LABELS, FAVORITES_LIST_SLUG } from "@/lib/lists";
import { getSiteUrl } from "@/lib/supabase/env";
import type { ProductListParams } from "@/lib/product-list-filters";
import { Button } from "@/components/ui/button";
import { ListsDbSetupBanner } from "@/components/lists/lists-db-setup-banner";
import { Heart, Pencil } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: slug === FAVORITES_LIST_SLUG ? "Mis favoritos" : "Mi lista" };
}

export default async function MyListDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ProductListParams>;
}) {
  const { slug } = await params;
  const filterParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?returnUrl=/cuenta/listas/${slug}`);

  let list;
  let isOwner = true;
  try {
    const editable = await getEditableListBySlug(supabase, user.id, slug);
    list = editable?.list ?? null;
    isOwner = editable?.isOwner ?? true;
  } catch (e) {
    console.error("getEditableListBySlug:", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("product_lists") || msg.includes("schema cache")) {
      return <ListsDbSetupBanner />;
    }
    throw e;
  }

  if (!list) notFound();

  const {
    id: listId,
    user_id: listUserId,
    title: listTitle,
    slug: listSlug,
    description: listDescription,
    visibility: listVisibility,
    vote_count: listVoteCount,
  } = list;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", listUserId)
    .single();

  const { cards } = await getListProductCards(supabase, listId, filterParams);
  const { isLoggedIn, favoriteIds } = await getProductCardAuthContext(supabase);

  const sharePath =
    profile?.username && listVisibility !== "private"
      ? `/listas/${profile.username}/${listSlug}`
      : null;
  const shareUrl = sharePath ? `${getSiteUrl()}${sharePath}` : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          {listSlug === FAVORITES_LIST_SLUG && (
            <Heart className="mb-2 h-7 w-7 fill-red-500 text-red-500" />
          )}
          <h1 className="text-2xl font-bold text-[var(--color-brown)]">{listTitle}</h1>
          {!isOwner && (
            <p className="mt-1 text-xs text-[var(--color-accent)]">Colaborás en esta lista</p>
          )}
          {listDescription && (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {listDescription}
            </p>
          )}
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {LIST_VISIBILITY_LABELS[listVisibility]} · {listVoteCount}{" "}
            {listVoteCount === 1 ? "voto" : "votos"} · {cards.length} productos
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={`/cuenta/listas/${slug}/editar`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
          {shareUrl && (
            <Button asChild variant="outline" size="sm">
              <Link href={sharePath!}>Vista pública</Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href="/cuenta/listas">Todas mis listas</Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={null}>
        <ProductListToolbar />
      </Suspense>

      {cards.length > 0 ? (
        <ProductCardGrid
          products={cards}
          isLoggedIn={isLoggedIn}
          favoriteIds={favoriteIds}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-brand-cream)] p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          {listSlug === FAVORITES_LIST_SLUG
            ? "Guardá productos con el corazón en cualquier ficha."
            : "Agregá productos desde su ficha con «Agregar a lista»."}
        </div>
      )}
    </div>
  );
}
