import type { SupabaseClient } from "@supabase/supabase-js";
import type { Place } from "@/types/database";

const PLACE_SELECT =
  "id, name, slug, place_type, description, address, city, lat, lng, phone, website, cover_image_url, google_place_id, celiac_level, celiac_notes, created_by, deleted_at, created_at, updated_at";

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
>;

export async function fetchPublicPlaces(
  supabase: SupabaseClient
): Promise<PlaceListItem[]> {
  const { data, error } = await supabase
    .from("places")
    .select(
      "id, name, slug, place_type, address, city, lat, lng, celiac_level, cover_image_url"
    )
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
