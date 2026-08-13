import { randomUUID } from "crypto";
import type { PlaceType } from "@/types/database";

const AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";

export function getGooglePlacesApiKey(): string | null {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  return key || null;
}

export function isGooglePlacesConfigured(): boolean {
  return Boolean(getGooglePlacesApiKey());
}

export function newPlacesSessionToken(): string {
  return randomUUID();
}

export type GooglePlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
};

export type GooglePlaceDetails = {
  googlePlaceId: string;
  name: string;
  address: string | null;
  city: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  coverImageUrl: string | null;
  suggestedPlaceType: PlaceType;
  photoAttribution: string | null;
};

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
  error?: { message?: string; status?: string };
};

type PlaceDetailsResponse = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
  types?: string[];
  photos?: Array<{
    name?: string;
    authorAttributions?: Array<{ displayName?: string }>;
  }>;
  error?: { message?: string; status?: string };
};

function mapPlaceType(types: string[] | undefined): PlaceType {
  const set = new Set(types ?? []);
  if (
    set.has("restaurant") ||
    set.has("cafe") ||
    set.has("bakery") ||
    set.has("meal_takeaway") ||
    set.has("meal_delivery") ||
    set.has("bar") ||
    set.has("food")
  ) {
    return "restaurante";
  }
  return "comercio";
}

function extractCity(
  components: PlaceDetailsResponse["addressComponents"]
): string | null {
  if (!components?.length) return null;
  const find = (...types: string[]) =>
    components.find((c) => types.some((t) => c.types?.includes(t)))?.longText ??
    null;
  return (
    find("locality") ||
    find("administrative_area_level_2") ||
    find("postal_town") ||
    find("administrative_area_level_1")
  );
}

async function resolvePhotoUri(photoName: string): Promise<string | null> {
  const key = getGooglePlacesApiKey();
  if (!key || !photoName) return null;

  const url = new URL(
    `https://places.googleapis.com/v1/${photoName}/media`
  );
  url.searchParams.set("maxHeightPx", "800");
  url.searchParams.set("maxWidthPx", "1200");
  url.searchParams.set("skipHttpRedirect", "true");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) {
    console.error("Google Places photo:", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as { photoUri?: string };
  return data.photoUri ?? null;
}

export async function googlePlacesAutocomplete(
  input: string,
  sessionToken: string
): Promise<{ ok: true; suggestions: GooglePlaceSuggestion[] } | { ok: false; error: string; status?: number }> {
  const key = getGooglePlacesApiKey();
  if (!key) {
    return {
      ok: false,
      error:
        "Falta GOOGLE_PLACES_API_KEY. Configurá la variable en .env.local y en Vercel.",
      status: 503,
    };
  }

  const trimmed = input.trim();
  if (trimmed.length < 2) {
    return { ok: true, suggestions: [] };
  }

  const res = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
    },
    body: JSON.stringify({
      input: trimmed,
      languageCode: "es",
      includedRegionCodes: ["ar"],
      sessionToken,
    }),
    next: { revalidate: 0 },
  });

  const data = (await res.json()) as AutocompleteResponse;
  if (!res.ok) {
    const msg =
      data.error?.message ??
      `Google Places autocomplete falló (${res.status}).`;
    console.error("googlePlacesAutocomplete:", msg);
    return { ok: false, error: msg, status: res.status };
  }

  const suggestions: GooglePlaceSuggestion[] = [];
  for (const s of data.suggestions ?? []) {
    const p = s.placePrediction;
    if (!p?.placeId) continue;
    suggestions.push({
      placeId: p.placeId,
      mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
      fullText: p.text?.text ?? "",
    });
  }

  return { ok: true, suggestions };
}

export async function googlePlaceDetails(
  placeId: string,
  sessionToken?: string
): Promise<{ ok: true; place: GooglePlaceDetails } | { ok: false; error: string; status?: number }> {
  const key = getGooglePlacesApiKey();
  if (!key) {
    return {
      ok: false,
      error:
        "Falta GOOGLE_PLACES_API_KEY. Configurá la variable en .env.local y en Vercel.",
      status: 503,
    };
  }

  const id = placeId.replace(/^places\//, "").trim();
  if (!id) {
    return { ok: false, error: "placeId inválido.", status: 400 };
  }

  const url = new URL(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`
  );
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
  url.searchParams.set("languageCode", "es");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": [
        "id",
        "displayName",
        "formattedAddress",
        "addressComponents",
        "location",
        "nationalPhoneNumber",
        "internationalPhoneNumber",
        "websiteUri",
        "types",
        "photos",
      ].join(","),
    },
    next: { revalidate: 0 },
  });

  const data = (await res.json()) as PlaceDetailsResponse;
  if (!res.ok) {
    const msg =
      data.error?.message ?? `Google Place Details falló (${res.status}).`;
    console.error("googlePlaceDetails:", msg);
    return { ok: false, error: msg, status: res.status };
  }

  const lat = data.location?.latitude;
  const lng = data.location?.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") {
    return {
      ok: false,
      error: "El lugar de Google no tiene coordenadas.",
      status: 422,
    };
  }

  const photoName = data.photos?.[0]?.name;
  const coverImageUrl = photoName ? await resolvePhotoUri(photoName) : null;
  const attribution =
    data.photos?.[0]?.authorAttributions?.[0]?.displayName ?? null;

  return {
    ok: true,
    place: {
      googlePlaceId: data.id ?? id,
      name: data.displayName?.text?.trim() || "Sin nombre",
      address: data.formattedAddress ?? null,
      city: extractCity(data.addressComponents),
      lat,
      lng,
      phone:
        data.nationalPhoneNumber ?? data.internationalPhoneNumber ?? null,
      website: data.websiteUri ?? null,
      coverImageUrl,
      suggestedPlaceType: mapPlaceType(data.types),
      photoAttribution: attribution,
    },
  };
}
