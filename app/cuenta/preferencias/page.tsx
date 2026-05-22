import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PreferencesForm } from "@/components/auth/preferences-form";
import { TierProgressJourney } from "@/components/account/tier-progress-journey";
import {
  CollaborationsSection,
  type CollaborationItem,
} from "@/components/account/collaborations-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBrandName } from "@/lib/utils";
import type { UserTier, GlutenCertification } from "@/types/database";
import { Heart } from "lucide-react";

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
      products (id, slug, name, brands (name))
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: createdProducts } = await supabase
    .from("products")
    .select(
      `
      id, slug, name, created_at,
      brands (name)
    `
    )
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  const collaborations: CollaborationItem[] = [];

  for (const r of reviews ?? []) {
    const product = Array.isArray(r.products) ? r.products[0] : r.products;
    if (!product) continue;
    const brand = getBrandName(
      (product as { brands?: { name: string } | { name: string }[] }).brands
    );
    collaborations.push({
      kind: "review",
      id: r.id,
      date: r.created_at,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      brandName: brand,
      rating: r.rating,
      opinion: r.opinion,
      glutenCertification: r.gluten_certification as GlutenCertification,
    });
  }

  for (const p of createdProducts ?? []) {
    collaborations.push({
      kind: "product",
      id: p.id,
      date: p.created_at,
      productId: p.id,
      productSlug: p.slug,
      productName: p.name,
      brandName: getBrandName(p.brands),
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-brown)]">Mi cuenta</h1>
        <Button asChild variant="accent" size="sm" className="gap-2">
          <Link href="/cuenta/favoritos">
            <Heart className="h-4 w-4 fill-current" />
            Mis favoritos
          </Link>
        </Button>
      </div>

      <TierProgressJourney
        collaborationCount={profile.collaboration_count}
        tier={profile.tier as UserTier}
      />

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
            Evaluaciones y productos que diste de alta en la comunidad.
          </p>
        </CardHeader>
        <CardContent>
          <CollaborationsSection items={collaborations} />
        </CardContent>
      </Card>
    </div>
  );
}
