import type { SupabaseClient } from "@supabase/supabase-js";

export type AnalyticsRange = "7d" | "30d" | "90d";

export const ANALYTICS_RANGES: { value: AnalyticsRange; label: string; days: number }[] = [
  { value: "7d", label: "7 días", days: 7 },
  { value: "30d", label: "30 días", days: 30 },
  { value: "90d", label: "90 días", days: 90 },
];

export type DailyBucket = { date: string; count: number };

export type AnalyticsSeries = {
  key: string;
  label: string;
  color: string;
  current: number;
  previous: number;
  changePercent: number | null;
  buckets: DailyBucket[];
};

export type TopProductRow = {
  product_id: string;
  name: string;
  slug: string;
  review_count: number;
};

export type AdminAnalytics = {
  range: AnalyticsRange;
  periodLabel: string;
  series: AnalyticsSeries[];
  topProducts: TopProductRow[];
  moderationActions: { current: number; previous: number; changePercent: number | null };
  reportsResolved: { current: number; previous: number; changePercent: number | null };
};

const SERIES_META: { key: string; label: string; color: string }[] = [
  { key: "users", label: "Usuarios nuevos", color: "#2d6a4f" },
  { key: "products", label: "Productos cargados", color: "#40916c" },
  { key: "reviews", label: "Evaluaciones", color: "#52b788" },
  { key: "reports", label: "Reportes recibidos", color: "#d4a373" },
];

function parseRange(range: string): AnalyticsRange {
  if (range === "7d" || range === "30d" || range === "90d") return range;
  return "30d";
}

function getRangeWindow(range: AnalyticsRange) {
  const days = ANALYTICS_RANGES.find((r) => r.value === range)!.days;
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const prevEnd = new Date(start);
  prevEnd.setMilliseconds(-1);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));
  prevStart.setHours(0, 0, 0, 0);

  const fetchFrom = new Date(prevStart);
  fetchFrom.setHours(0, 0, 0, 0);

  return { days, start, end, prevStart, prevEnd, fetchFrom };
}

function inWindow(iso: string, from: Date, to: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function buildDailyBuckets(
  dates: string[],
  rangeStart: Date,
  days: number
): DailyBucket[] {
  const buckets: DailyBucket[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    buckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  const index = new Map(buckets.map((b, i) => [b.date, i]));
  for (const iso of dates) {
    const key = iso.slice(0, 10);
    const idx = index.get(key);
    if (idx !== undefined) buckets[idx].count++;
  }
  return buckets;
}

function splitCounts(
  dates: string[],
  start: Date,
  end: Date,
  prevStart: Date,
  prevEnd: Date
) {
  let current = 0;
  let previous = 0;
  const currentDates: string[] = [];
  for (const iso of dates) {
    if (inWindow(iso, start, end)) {
      current++;
      currentDates.push(iso);
    } else if (inWindow(iso, prevStart, prevEnd)) {
      previous++;
    }
  }
  return { current, previous, currentDates };
}

export async function fetchAdminAnalytics(
  supabase: SupabaseClient,
  rangeParam = "30d"
): Promise<AdminAnalytics> {
  const range = parseRange(rangeParam);
  const { days, start, end, prevStart, prevEnd, fetchFrom } = getRangeWindow(range);
  const fetchFromIso = fetchFrom.toISOString();

  const [
    { data: profileRows },
    { data: productRows },
    { data: reviewRows },
    { data: reportRows },
    { data: auditRows },
    { data: reviewDetailRows },
  ] = await Promise.all([
    supabase.from("profiles").select("created_at").gte("created_at", fetchFromIso),
    supabase.from("products").select("created_at").gte("created_at", fetchFromIso),
    supabase
      .from("reviews")
      .select("created_at, product_id")
      .gte("created_at", fetchFromIso)
      .is("deleted_at", null),
    supabase
      .from("reports")
      .select("created_at, resolved_at")
      .or(`created_at.gte.${fetchFromIso},resolved_at.gte.${fetchFromIso}`),
    supabase
      .from("admin_audit_log")
      .select("created_at")
      .gte("created_at", fetchFromIso),
    supabase
      .from("reviews")
      .select("product_id, products(name, slug)")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .is("deleted_at", null),
  ]);

  const dateSources: Record<string, string[]> = {
    users: (profileRows ?? []).map((r) => r.created_at),
    products: (productRows ?? []).map((r) => r.created_at),
    reviews: (reviewRows ?? []).map((r) => r.created_at),
    reports: (reportRows ?? []).map((r) => r.created_at),
  };

  const series: AnalyticsSeries[] = SERIES_META.map((meta) => {
    const { current, previous, currentDates } = splitCounts(
      dateSources[meta.key],
      start,
      end,
      prevStart,
      prevEnd
    );
    return {
      ...meta,
      current,
      previous,
      changePercent: pctChange(current, previous),
      buckets: buildDailyBuckets(currentDates, start, days),
    };
  });

  const resolvedDates = (reportRows ?? [])
    .map((r) => r.resolved_at)
    .filter((d): d is string => Boolean(d));

  const modSplit = splitCounts(
    (auditRows ?? []).map((r) => r.created_at),
    start,
    end,
    prevStart,
    prevEnd
  );

  const resolvedSplit = splitCounts(
    resolvedDates,
    start,
    end,
    prevStart,
    prevEnd
  );

  const productCounts = new Map<string, number>();
  for (const row of reviewDetailRows ?? []) {
    const pid = row.product_id as string;
    productCounts.set(pid, (productCounts.get(pid) ?? 0) + 1);
  }

  const topIds = [...productCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topProducts: TopProductRow[] = topIds.map(([product_id, review_count]) => {
    const detail = (reviewDetailRows ?? []).find((r) => r.product_id === product_id);
    const product = detail?.products;
    const p = Array.isArray(product) ? product[0] : product;
    return {
      product_id,
      name: (p as { name?: string } | undefined)?.name ?? "Producto",
      slug: (p as { slug?: string } | undefined)?.slug ?? "",
      review_count,
    };
  });

  const periodLabel = ANALYTICS_RANGES.find((r) => r.value === range)!.label;

  return {
    range,
    periodLabel,
    series,
    topProducts,
    moderationActions: {
      current: modSplit.current,
      previous: modSplit.previous,
      changePercent: pctChange(modSplit.current, modSplit.previous),
    },
    reportsResolved: {
      current: resolvedSplit.current,
      previous: resolvedSplit.previous,
      changePercent: pctChange(resolvedSplit.current, resolvedSplit.previous),
    },
  };
}
