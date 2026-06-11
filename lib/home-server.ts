import type { SupabaseClient } from "@supabase/supabase-js";
import { visibleProductImages } from "@/lib/product-images-display";
import { getTopPublicLists } from "@/lib/lists-server";
import { getBrandName } from "@/lib/utils";
import type { UserTier } from "@/types/database";

export type HomeAvatarProfile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export type HomeLatestReview = {
  id: string;
  rating: number;
  opinion: string;
  created_at: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  user_id: string;
  tier: UserTier;
  product_name: string;
  product_slug: string;
  brand_name: string | null;
  product_review_count: number;
};

export type HomeTopRatedProduct = {
  id: string;
  slug: string;
  name: string;
  weighted_rating: number | null;
  review_count: number;
  image_url: string | null;
  brand_name: string | null;
  featured_opinion: string | null;
  featured_rating: number | null;
  featured_display_name: string | null;
  featured_tier: UserTier | null;
};

export type RatingBreakdown = {
  mustTry: number;
  worthTry: number;
  notForMe: number;
};

export type HomeFeaturedProduct = HomeTopRatedProduct & {
  ai_summary: string | null;
  rating_breakdown: RatingBreakdown;
};

export type HomePageData = {
  collaboratorCount: number;
  avatarProfiles: HomeAvatarProfile[];
  latestReviews: HomeLatestReview[];
  topRated: HomeTopRatedProduct[];
  featuredProduct: HomeFeaturedProduct | null;
  topLists: Awaited<ReturnType<typeof getTopPublicLists>>;
};

export async function getHomePageData(supabase: SupabaseClient): Promise<HomePageData> {
  const [collaboratorCount, avatarProfiles, latestReviews, topRated, topLists] =
    await Promise.all([
      getCollaboratorCount(supabase),
      getAvatarStripProfiles(supabase),
      getLatestReviews(supabase, 3),
      getTopRatedWithFeaturedReview(supabase, 3),
      getTopPublicLists(supabase, 3),
    ]);

  const featuredProduct = await buildFeaturedProduct(supabase, topRated[0] ?? null);

  return {
    collaboratorCount,
    avatarProfiles,
    latestReviews,
    topRated,
    featuredProduct,
    topLists,
  };
}

async function getRatingBreakdown(
  supabase: SupabaseClient,
  productId: string
): Promise<RatingBreakdown> {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId);

  const rows = reviews ?? [];
  if (!rows.length) return { mustTry: 0, worthTry: 0, notForMe: 0 };

  let mustTry = 0;
  let worthTry = 0;
  let notForMe = 0;
  for (const r of rows) {
    if (r.rating >= 4) mustTry += 1;
    else if (r.rating === 3) worthTry += 1;
    else notForMe += 1;
  }
  const total = rows.length;
  return {
    mustTry: Math.round((mustTry / total) * 100),
    worthTry: Math.round((worthTry / total) * 100),
    notForMe: Math.round((notForMe / total) * 100),
  };
}

async function buildFeaturedProduct(
  supabase: SupabaseClient,
  top: HomeTopRatedProduct | null
): Promise<HomeFeaturedProduct | null> {
  if (!top) return null;

  const { data: product } = await supabase
    .from("products")
    .select("ai_summary")
    .eq("id", top.id)
    .maybeSingle();

  const rating_breakdown = await getRatingBreakdown(supabase, top.id);

  return {
    ...top,
    ai_summary: product?.ai_summary ?? null,
    rating_breakdown,
  };
}

async function getCollaboratorCount(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

async function getAvatarStripProfiles(supabase: SupabaseClient): Promise<HomeAvatarProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return data ?? [];
}

export async function getLatestReviews(
  supabase: SupabaseClient,
  limit = 3
): Promise<HomeLatestReview[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id, rating, opinion, created_at, user_id,
      profiles (display_name, username, avatar_url, tier),
      products (name, slug, review_count, brands (name))
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const brands = product
      ? (product as { brands?: { name: string } | { name: string }[] }).brands
      : null;
    return {
      id: row.id,
      rating: row.rating,
      opinion: row.opinion,
      created_at: row.created_at,
      user_id: row.user_id,
      display_name: (profile as { display_name: string | null })?.display_name ?? null,
      username: (profile as { username: string | null })?.username ?? null,
      avatar_url: (profile as { avatar_url: string | null })?.avatar_url ?? null,
      tier: ((profile as { tier?: UserTier })?.tier ?? "none") as UserTier,
      product_name: (product as { name: string })?.name ?? "Producto",
      product_slug: (product as { slug: string })?.slug ?? "",
      brand_name: getBrandName(brands) ?? null,
      product_review_count: (product as { review_count?: number })?.review_count ?? 0,
    };
  });
}

export async function getTopRatedWithFeaturedReview(
  supabase: SupabaseClient,
  limit = 3
): Promise<HomeTopRatedProduct[]> {
  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      id, slug, name, weighted_rating, review_count,
      brands (name),
      product_images (url, sort_order, is_hidden)
    `
    )
    .gt("review_count", 0)
    .order("weighted_rating", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  if (!products?.length) return [];

  const productIds = products.map((p) => p.id);
  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      `
      product_id, rating, opinion,
      profiles (display_name, tier)
    `
    )
    .in("product_id", productIds)
    .order("rating", { ascending: false });

  const bestByProduct = new Map<
    string,
    {
      opinion: string;
      rating: number;
      display_name: string | null;
      tier: UserTier;
    }
  >();

  for (const r of reviews ?? []) {
    if (bestByProduct.has(r.product_id)) continue;
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    bestByProduct.set(r.product_id, {
      opinion: r.opinion,
      rating: r.rating,
      display_name: (profile as { display_name: string | null })?.display_name ?? null,
      tier: ((profile as { tier?: UserTier })?.tier ?? "none") as UserTier,
    });
  }

  return products.map((p) => {
    const images = visibleProductImages(
      (p.product_images ?? []) as { url: string; sort_order: number; is_hidden?: boolean }[]
    );
    const featured = bestByProduct.get(p.id);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      weighted_rating: p.weighted_rating,
      review_count: p.review_count,
      image_url: images[0]?.url ?? null,
      brand_name:
        getBrandName((p as { brands?: { name: string } | { name: string }[] }).brands) ??
        null,
      featured_opinion: featured?.opinion ?? null,
      featured_rating: featured?.rating ?? null,
      featured_display_name: featured?.display_name ?? null,
      featured_tier: featured?.tier ?? null,
    };
  });
}
