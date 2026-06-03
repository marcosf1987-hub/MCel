import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductCardGrid } from "@/components/product/product-card-grid";
import { ProductListToolbar } from "@/components/product/product-list-toolbar";
import {
  getListByUsernameSlug,
  getListProductCards,
  hasUserSavedList,
  hasUserVotedList,
} from "@/lib/lists-server";
import { getProductCardAuthContext } from "@/lib/product-card-auth";
import { LIST_VISIBILITY_LABELS } from "@/lib/lists";
import { getSiteUrl } from "@/lib/supabase/env";
import { ListVoteButton } from "@/components/lists/list-vote-button";
import { SaveListButton } from "@/components/lists/save-list-button";
import { ShareListButton } from "@/components/lists/share-list-button";
import { ReportButton } from "@/components/product/report-button";
import type { ListVisibility } from "@/types/database";
import type { ProductListParams } from "@/lib/product-list-filters";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; listSlug: string }>;
}) {
  const { username, listSlug } = await params;
  const supabase = await createClient();
  const result = await getListByUsernameSlug(
    supabase,
    username,
    listSlug,
    null
  );
  return { title: result?.list.title ?? `Lista — ${username}` };
}

export default async function PublicListPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; listSlug: string }>;
  searchParams: Promise<ProductListParams>;
}) {
  const { username, listSlug } = await params;
  const filterParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await getListByUsernameSlug(
    supabase,
    username,
    listSlug,
    user?.id ?? null
  );

  if (!result) notFound();

  const { list, profile } = result;
  const isOwner = user?.id === list.user_id;
  const voted = user ? await hasUserVotedList(supabase, list.id, user.id) : false;
  const saved = user ? await hasUserSavedList(supabase, list.id, user.id) : false;
  const saveCount = (list as { save_count?: number }).save_count ?? 0;

  const { cards } = await getListProductCards(supabase, list.id, filterParams);
  const { isLoggedIn, favoriteIds } = await getProductCardAuthContext(supabase);

  const listUrl = `${getSiteUrl()}/listas/${username}/${listSlug}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        <Link href={`/perfil/${username}`} className="hover:underline">
          {profile.display_name ?? profile.username}
        </Link>
        {" · "}
        {LIST_VISIBILITY_LABELS[list.visibility as ListVisibility]}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-[var(--color-brown)]">{list.title}</h1>
      {list.description && (
        <p className="mt-2 text-sm text-[var(--color-neutral)]">{list.description}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <ListVoteButton
          listId={list.id}
          initialVoteCount={list.vote_count}
          initialVoted={voted}
          isLoggedIn={Boolean(user)}
          isOwner={isOwner}
        />
        <SaveListButton
          listId={list.id}
          initialSaved={saved}
          initialSaveCount={saveCount}
          isLoggedIn={Boolean(user)}
          isOwner={isOwner}
        />
        {(list.visibility === "public" || list.visibility === "unlisted") && (
          <ShareListButton
            listTitle={list.title}
            listUrl={listUrl}
            voteCount={list.vote_count}
          />
        )}
        {!isOwner && user && (
          <ReportButton targetType="list" targetId={list.id} />
        )}
        {isOwner && (
          <Link
            href={`/cuenta/listas/${list.slug}/editar`}
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Editar lista
          </Link>
        )}
      </div>

      <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
        {cards.length} producto{cards.length !== 1 ? "s" : ""}
      </p>

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
        <p className="mt-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Esta lista todavía no tiene productos.
        </p>
      )}
    </div>
  );
}
