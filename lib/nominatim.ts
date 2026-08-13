/**
 * Cliente Nominatim (OpenStreetMap) para geocoding.
 * Política: ~1 req/s, User-Agent identificable, cache corta.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";

const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT?.trim() ||
  "CeliApp/1.0 (https://celiapp.org; locales-geocode)";

/** Serializa llamadas a Nominatim a ≥1s entre requests (este proceso). */
let lastNominatimAt = 0;
let nominatimChain: Promise<void> = Promise.resolve();

function waitForNominatimSlot(): Promise<void> {
  const run = async () => {
    const elapsed = Date.now() - lastNominatimAt;
    if (elapsed < 1100) {
      await new Promise((r) => setTimeout(r, 1100 - elapsed));
    }
    lastNominatimAt = Date.now();
  };
  nominatimChain = nominatimChain.then(run, run);
  return nominatimChain;
}

type CacheEntry = { at: number; results: NominatimResult[] };
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000;

export type NominatimResult = {
  lat: number;
  lng: number;
  displayName: string;
  name: string | null;
  address: string | null;
  city: string | null;
};

type NominatimRaw = {
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
  };
};

function parseCity(addr: NominatimRaw["address"]): string | null {
  if (!addr) return null;
  return (
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.state ||
    null
  );
}

function parseStreetAddress(addr: NominatimRaw["address"]): string | null {
  if (!addr) return null;
  const parts = [addr.road, addr.house_number].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (addr.suburb) return addr.suburb;
  return null;
}

function mapRaw(raw: NominatimRaw): NominatimResult | null {
  const lat = Number(raw.lat);
  const lng = Number(raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const street = parseStreetAddress(raw.address);
  return {
    lat,
    lng,
    displayName: raw.display_name ?? `${lat}, ${lng}`,
    name: raw.name?.trim() || null,
    address: street || raw.display_name || null,
    city: parseCity(raw.address),
  };
}

async function nominatimFetch(url: URL): Promise<Response> {
  await waitForNominatimSlot();
  return fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    next: { revalidate: 0 },
  });
}

export async function nominatimSearch(
  query: string,
  limit = 5
): Promise<
  | { ok: true; results: NominatimResult[] }
  | { ok: false; error: string; status?: number }
> {
  const q = query.trim();
  if (q.length < 3) return { ok: true, results: [] };

  const cacheKey = `${q.toLowerCase()}|${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ok: true, results: cached.results };
  }

  const url = new URL(NOMINATIM_SEARCH);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(Math.min(10, Math.max(1, limit))));
  url.searchParams.set("countrycodes", "ar");
  url.searchParams.set("accept-language", "es");

  try {
    const res = await nominatimFetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error("nominatimSearch:", res.status, text.slice(0, 200));
      return {
        ok: false,
        error: `Nominatim respondió ${res.status}. Probá de nuevo en unos segundos.`,
        status: res.status,
      };
    }
    const data = (await res.json()) as NominatimRaw[];
    const results = (Array.isArray(data) ? data : [])
      .map(mapRaw)
      .filter((r): r is NominatimResult => r != null);

    searchCache.set(cacheKey, { at: Date.now(), results });
    if (searchCache.size > 200) {
      const oldest = [...searchCache.entries()].sort(
        (a, b) => a[1].at - b[1].at
      )[0];
      if (oldest) searchCache.delete(oldest[0]);
    }

    return { ok: true, results };
  } catch (e) {
    console.error("nominatimSearch:", e);
    return { ok: false, error: "No se pudo contactar Nominatim." };
  }
}

export async function nominatimReverse(
  lat: number,
  lng: number
): Promise<
  | { ok: true; result: NominatimResult }
  | { ok: false; error: string; status?: number }
> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, error: "Coordenadas inválidas.", status: 400 };
  }

  const url = new URL(NOMINATIM_REVERSE);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("accept-language", "es");

  try {
    const res = await nominatimFetch(url);
    if (!res.ok) {
      return {
        ok: false,
        error: `Nominatim reverse ${res.status}.`,
        status: res.status,
      };
    }
    const data = (await res.json()) as NominatimRaw & { error?: string };
    if (data.error) {
      return { ok: false, error: data.error };
    }
    const mapped = mapRaw({
      ...data,
      lat: data.lat ?? String(lat),
      lon: data.lon ?? String(lng),
    });
    if (!mapped) {
      return { ok: false, error: "Sin resultado de reverse geocode." };
    }
    return { ok: true, result: mapped };
  } catch (e) {
    console.error("nominatimReverse:", e);
    return { ok: false, error: "No se pudo contactar Nominatim." };
  }
}
