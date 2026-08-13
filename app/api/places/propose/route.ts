import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  proposePlaceSchema,
  zodErrorMessage,
} from "@/lib/validation/api-schemas";
import { resolveUniquePlaceSlug } from "@/lib/places";

function emptyToNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t || null;
}

/** Proponer local (queda pending hasta moderación). */
export async function POST(request: NextRequest) {
  const json = (body: object, status = 200, headers?: HeadersInit) =>
    NextResponse.json(body, { status, headers });

  try {
    const env = getSupabasePublicEnv();
    if (!env.ok) return json({ ok: false, error: env.error }, 500);

    const response = NextResponse.next();
    const supabase = createClientFromRequest(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return json(
        { ok: false, error: "Necesitás iniciar sesión.", needsLogin: true },
        401
      );
    }

    const limited = rateLimit(
      `places:propose:${user.id}:${clientIp(request)}`,
      5,
      60_000
    );
    if (!limited.ok) {
      const r = rateLimitResponse(limited.retryAfterSec);
      return json(r.body, r.status, r.headers);
    }

    const parsed = proposePlaceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ ok: false, error: zodErrorMessage(parsed.error) }, 400);
    }

    const d = parsed.data;
    const slug = await resolveUniquePlaceSlug(supabase, d.name);

    const { data, error } = await supabase
      .from("places")
      .insert({
        name: d.name,
        slug,
        place_type: d.place_type,
        description: emptyToNull(d.description),
        address: emptyToNull(d.address),
        city: emptyToNull(d.city),
        lat: d.lat,
        lng: d.lng,
        phone: emptyToNull(d.phone),
        website: emptyToNull(d.website ?? null),
        cover_image_url: emptyToNull(d.cover_image_url ?? null),
        celiac_level: d.celiac_level,
        celiac_notes: emptyToNull(d.celiac_notes),
        status: "pending",
        created_by: user.id,
      })
      .select("id, slug, name, status")
      .single();

    if (error) {
      console.error("propose place:", error);
      return json({ ok: false, error: error.message }, 500);
    }

    return json({ ok: true, place: data });
  } catch (e) {
    console.error("propose place:", e);
    return json({ ok: false, error: "Error al proponer el local." }, 500);
  }
}
