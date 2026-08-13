import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { logAdminAction } from "@/lib/admin/audit-log";
import {
  isValidLat,
  isValidLng,
  parseCoord,
  resolveUniquePlaceSlug,
} from "@/lib/places";
import type { PlaceCeliacLevel, PlaceType } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: placeId } = await context.params;
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;
  const body = await request.json();

  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return withAdminCookies(
        response,
        adminJson({ ok: false, error: "Nombre requerido." }, 400)
      );
    }
    updates.name = name;
    updates.slug = await resolveUniquePlaceSlug(supabase, name, placeId);
  }

  if (body.place_type !== undefined) {
    if (!PLACE_TYPES.includes(body.place_type)) {
      return withAdminCookies(
        response,
        adminJson({ ok: false, error: "Tipo de local inválido." }, 400)
      );
    }
    updates.place_type = body.place_type;
  }

  if (body.lat !== undefined || body.lng !== undefined) {
    const lat = parseCoord(body.lat);
    const lng = parseCoord(body.lng);
    if (lat === null || lng === null || !isValidLat(lat) || !isValidLng(lng)) {
      return withAdminCookies(
        response,
        adminJson(
          { ok: false, error: "Latitud y longitud válidas requeridas." },
          400
        )
      );
    }
    updates.lat = lat;
    updates.lng = lng;
  }

  if (body.celiac_level !== undefined) {
    if (!CELIAC_LEVELS.includes(body.celiac_level)) {
      return withAdminCookies(
        response,
        adminJson({ ok: false, error: "Nivel celíaco inválido." }, 400)
      );
    }
    updates.celiac_level = body.celiac_level;
  }

  for (const key of [
    "description",
    "address",
    "city",
    "phone",
    "website",
    "cover_image_url",
    "celiac_notes",
  ] as const) {
    if (body[key] !== undefined) {
      updates[key] = optionalText(body[key]);
    }
  }

  if (body.google_place_id !== undefined) {
    updates.google_place_id = optionalText(body.google_place_id);
  }

  if (body.restore === true) {
    updates.deleted_at = null;
  }

  if (Object.keys(updates).length === 0) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Sin cambios." }, 400)
    );
  }

  const { error } = await supabase
    .from("places")
    .update(updates)
    .eq("id", placeId);

  if (error) {
    const msg =
      error.code === "23505"
        ? "Conflicto de slug o google_place_id."
        : error.message;
    return withAdminCookies(response, adminJson({ ok: false, error: msg }, 500));
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: body.restore === true ? "restore_place" : "update_place",
    entityType: "place",
    entityId: placeId,
    metadata: updates,
  });

  return withAdminCookies(response, adminJson({ ok: true }));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: placeId } = await context.params;
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;

  const { error } = await supabase
    .from("places")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", placeId);

  if (error) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: error.message }, 500)
    );
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: "soft_delete_place",
    entityType: "place",
    entityId: placeId,
  });

  return withAdminCookies(response, adminJson({ ok: true }));
}
