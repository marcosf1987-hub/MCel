import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PreferencesForm } from "@/components/auth/preferences-form";
import { AvatarUpload } from "@/components/account/avatar-upload";
import { TierProgressJourney } from "@/components/account/tier-progress-journey";
import { CollaborationsSection } from "@/components/account/collaborations-section";
import type { CollaborationItem } from "@/components/account/collaborations-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBrandName } from "@/lib/utils";
import type { UserTier, GlutenCertification } from "@/types/database";
import { Bookmark, Heart, ListMusic, Plus, Rss } from "lucide-react";

export const metadata = { title: "Mi cuenta" };

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?returnUrl=/cuenta/preferencias");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, opinion, gluten_certification, created_at,
      products (id, slug, name, review_count, weighted_rating, brands (name))
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const collaborations: CollaborationItem[] = [];

  for (const r of reviews ?? []) {
    const product = Array.isArray(r.products) ? r.products[0] : r.products;
    if (!product) continue;
    const brand = getBrandName(
      (product as { brands?: { name: string } | { name: string }[] }).brands
    );
    collaborations.push({
      id: r.id,
      date: r.created_at,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      brandName: brand,
      rating: r.rating,
      opinion: r.opinion,
      glutenCertification: r.gluten_certification as GlutenCertification,
      productReviewCount: product.review_count ?? 0,
      productWeightedRating: product.weighted_rating,
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-brown)]">Mi cuenta</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="accent" size="sm" className="gap-2">
            <Link href="/cuenta/listas/mis-favoritos">
              <Heart className="h-4 w-4 fill-current" />
              Favoritos
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/cuenta/listas">
              <ListMusic className="h-4 w-4" />
              Mis listas
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/cuenta/listas/guardadas">
              <Bookmark className="h-4 w-4" />
              Guardadas
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/cuenta/feed">
              <Rss className="h-4 w-4" />
              Feed
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/cuenta/listas/nueva">
              <Plus className="h-4 w-4" />
              Nueva lista
            </Link>
          </Button>
        </div>
      </div>

      <TierProgressJourney
        collaborationCount={profile.collaboration_count}
        tier={profile.tier as UserTier}
      />

      <Card>
        <CardHeader>
          <CardTitle>Foto de perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            userId={profile.id}
            displayName={profile.display_name}
            username={profile.username}
            avatarUrl={profile.avatar_url}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferencias</CardTitle>
        </CardHeader>
        <CardContent>
          <PreferencesForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis colaboraciones</CardTitle>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Tus evaluaciones publicadas en la comunidad.
          </p>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-[var(--color-muted-foreground)]">Cargando…</p>}>
            <CollaborationsSection items={collaborations} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
