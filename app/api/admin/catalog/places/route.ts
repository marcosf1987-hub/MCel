import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { logAdminAction } from "@/lib/admin/audit-log";
import { fetchAdminPlaces } from "@/lib/places-server";
import {
  isValidLat,
  isValidLng,
  parseCoord,
  resolveUniquePlaceSlug,
} from "@/lib/places";
import type { PlaceCeliacLevel, PlaceType } from "@/types/database";

const PLACE_TYPES: PlaceType[] = ["comercio", "restaurante"];
const CELIAC_LEVELS: PlaceCeliacLevel[] = [
  "opciones",
  "dedicado",
  "certificado",
  "desconocido",
];

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t || null;
}

export async function GET(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response } = auth;
  const places = await fetchAdminPlaces(supabase);
  return withAdminCookies(response, adminJson({ ok: true, places }));
}

export async function POST(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;
  const body = await request.json();

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const placeType = body.place_type as PlaceType;
  const lat = parseCoord(body.lat);
  const lng = parseCoord(body.lng);
  const celiacLevel = (body.celiac_level as PlaceCeliacLevel) || "desconocido";

  if (!name) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Nombre requerido." }, 400)
    );
  }
  if (!PLACE_TYPES.includes(placeType)) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Tipo de local inválido." }, 400)
    );
  }
  if (lat === null || lng === null || !isValidLat(lat) || !isValidLng(lng)) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Latitud y longitud válidas requeridas." }, 400)
    );
  }
  if (!CELIAC_LEVELS.includes(celiacLevel)) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Nivel celíaco inválido." }, 400)
    );
  }

  const slug = await resolveUniquePlaceSlug(supabase, name);
  const googlePlaceId = optionalText(body.google_place_id);

  const { data, error } = await supabase
    .from("places")
    .insert({
      name,
      slug,
      place_type: placeType,
      description: optionalText(body.description),
      address: optionalText(body.address),
      city: optionalText(body.city),
      lat,
      lng,
      phone: optionalText(body.phone),
      website: optionalText(body.website),
      cover_image_url: optionalText(body.cover_image_url),
      google_place_id: googlePlaceId,
      celiac_level: celiacLevel,
      celiac_notes: optionalText(body.celiac_notes),
      created_by: session.userId,
    })
    .select(
      "id, name, slug, place_type, description, address, city, lat, lng, phone, website, cover_image_url, google_place_id, celiac_level, celiac_notes, created_by, deleted_at, created_at, updated_at"
    )
    .single();

  if (error) {
    const msg =
      error.code === "23505"
        ? "Ya existe un local con ese google_place_id o slug."
        : error.message;
    return withAdminCookies(response, adminJson({ ok: false, error: msg }, 500));
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: "create_place",
    entityType: "place",
    entityId: data.id,
    metadata: { name, slug },
  });

  return withAdminCookies(response, adminJson({ ok: true, place: data }));
}
