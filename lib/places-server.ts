import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Place,
  PlaceItem,
  PlaceReview,
  PlaceStatus,
} from "@/types/database";

export const PLACE_SELECT =
  "id, name, slug, place_type, description, address, city, lat, lng, phone, website, cover_image_url, google_place_id, celiac_level, celiac_notes, status, rejection_note, reviewed_by, reviewed_at, weighted_rating, review_count, created_by, deleted_at, created_at, updated_at";

export type PlaceListItem = Pick<
  Place,
  | "id"
  | "name"
  | "slug"
  | "place_type"
  | "address"
  | "city"
  | "lat"
  | "lng"
  | "celiac_level"
  | "cover_image_url"
  | "weighted_rating"
  | "review_count"
>;

export async function fetchPublicPlaces(
  supabase: SupabaseClient
): Promise<PlaceListItem[]> {
  const { data, error } = await supabase
    .from("places")
    .select(
      "id, name, slug, place_type, address, city, lat, lng, celiac_level, cover_image_url, weighted_rating, review_count"
    )
    .eq("status", "published")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchPublicPlaces:", error.message);
    return [];
  }
  return (data ?? []) as PlaceListItem[];
}

export async function fetchPlaceBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Place | null> {
  const { data, error } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("fetchPlaceBySlug:", error.message);
    return null;
  }
  return data as Place | null;
}

export async function fetchAdminPlaces(
  supabase: SupabaseClient
): Promise<Place[]> {
  const { data, error } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("fetchAdminPlaces:", error.message);
    return [];
  }
  return (data ?? []) as Place[];
}

export async function fetchPendingPlaces(
  supabase: SupabaseClient
): Promise<Place[]> {
  const { data, error } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchPendingPlaces:", error.message);
    return [];
  }
  return (data ?? []) as Place[];
}

export async function countPendingPlaces(
  supabase: SupabaseClient
): Promise<number> {
  const { count, error } = await supabase
    .from("places")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .is("deleted_at", null);

  if (error) {
    console.error("countPendingPlaces:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function fetchPlaceReviews(
  supabase: SupabaseClient,
  placeId: string,
  limit = 20
): Promise<PlaceReview[]> {
  const { data, error } = await supabase
    .from("place_reviews")
    .select(
      "id, place_id, user_id, rating, opinion, deleted_at, created_at, updated_at, profiles(display_name, username, avatar_url, tier)"
    )
    .eq("place_id", placeId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("fetchPlaceReviews:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const raw = row as Record<string, unknown>;
    const profileRaw = raw.profiles;
    const profile = Array.isArray(profileRaw)
      ? profileRaw[0]
      : profileRaw;
    const { profiles: _p, ...rest } = raw;
    return {
      ...(rest as Omit<PlaceReview, "profile">),
      profile: (profile as PlaceReview["profile"]) ?? undefined,
    };
  });
}

export async function fetchPlaceItems(
  supabase: SupabaseClient,
  placeId: string
): Promise<PlaceItem[]> {
  const { data, error } = await supabase
    .from("place_items")
    .select(
      "id, place_id, name, description, created_by, deleted_at, weighted_rating, review_count, created_at, updated_at"
    )
    .eq("place_id", placeId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("fetchPlaceItems:", error.message);
    return [];
  }
  return (data ?? []) as PlaceItem[];
}

export async function fetchUserPlaceReview(
  supabase: SupabaseClient,
  placeId: string,
  userId: string
): Promise<PlaceReview | null> {
  const { data } = await supabase
    .from("place_reviews")
    .select(
      "id, place_id, user_id, rating, opinion, deleted_at, created_at, updated_at"
    )
    .eq("place_id", placeId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as PlaceReview | null) ?? null;
}

/** Mapa place_item_id → valoración propia */
export async function fetchUserPlaceItemReviewsMap(
  supabase: SupabaseClient,
  placeId: string,
  userId: string
): Promise<Record<string, { id: string; rating: number; opinion: string | null }>> {
  const { data: items } = await supabase
    .from("place_items")
    .select("id")
    .eq("place_id", placeId)
    .is("deleted_at", null);

  const itemIds = (items ?? []).map((i) => i.id);
  if (itemIds.length === 0) return {};

  const { data: reviews } = await supabase
    .from("place_item_reviews")
    .select("id, place_item_id, rating, opinion")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .in("place_item_id", itemIds);

  const map: Record<
    string,
    { id: string; rating: number; opinion: string | null }
  > = {};
  for (const r of reviews ?? []) {
    map[r.place_item_id] = {
      id: r.id,
      rating: r.rating,
      opinion: r.opinion,
    };
  }
  return map;
}

export async function fetchUserPlaceProposals(
  supabase: SupabaseClient,
  userId: string
): Promise<Place[]> {
  const { data, error } = await supabase
    .from("places")
    .select(PLACE_SELECT)
    .eq("created_by", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchUserPlaceProposals:", error.message);
    return [];
  }
  return (data ?? []) as Place[];
}

export type PlaceModerationAction = Extract<
  PlaceStatus,
  "published" | "rejected"
>;
