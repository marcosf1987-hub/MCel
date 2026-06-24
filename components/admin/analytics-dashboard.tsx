"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsLineChart } from "@/components/admin/analytics-line-chart";
import {
  ANALYTICS_RANGES,
  type AdminAnalytics,
  type AnalyticsRange,
} from "@/lib/admin/analytics-server";
import { Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";

function ChangeBadge({
  current,
  previous,
  changePercent,
}: {
  current: number;
  previous: number;
  changePercent: number | null;
}) {
  if (changePercent === null && current === 0 && previous === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
        <Minus className="h-3 w-3" /> sin cambio
      </span>
    );
  }

  const up = (changePercent ?? 0) > 0;
  const flat = changePercent === 0 || changePercent === null;

  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${
        flat
          ? "text-[var(--color-muted-foreground)]"
          : up
            ? "text-emerald-700"
            : "text-red-600"
      }`}
    >
      {flat ? (
        <Minus className="h-3 w-3" />
      ) : up ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {changePercent === null
        ? "nuevo"
        : `${changePercent > 0 ? "+" : ""}${changePercent}%`}
      <span className="font-normal text-[var(--color-muted-foreground)]">
        vs período anterior ({previous})
      </span>
    </span>
  );
}

export function AnalyticsDashboard({
  initialAnalytics,
}: {
  initialAnalytics: AdminAnalytics;
}) {
  const [range, setRange] = useState<AnalyticsRange>(initialAnalytics.range);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextRange: AnalyticsRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${nextRange}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudieron cargar las métricas.");
        return;
      }
      setAnalytics(data.analytics as AdminAnalytics);
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (range !== initialAnalytics.range) {
      void load(range);
    }
  }, [range, initialAnalytics.range, load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {ANALYTICS_RANGES.map((r) => (
          <Button
            key={r.value}
            type="button"
            size="sm"
            variant={range === r.value ? "default" : "outline"}
            onClick={() => setRange(r.value)}
            disabled={loading}
          >
            {r.label}
          </Button>
        ))}
        {loading && <Loader2 className="h-4 w-4 animate-spin text-[var(--color-muted-foreground)]" />}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {analytics.series.map((s) => (
          <Card key={s.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums text-[var(--color-brown)]">
                {s.current}
              </p>
              <ChangeBadge
                current={s.current}
                previous={s.previous}
                changePercent={s.changePercent}
              />
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Reportes resueltos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-[var(--color-brown)]">
              {analytics.reportsResolved.current}
            </p>
            <ChangeBadge
              current={analytics.reportsResolved.current}
              previous={analytics.reportsResolved.previous}
              changePercent={analytics.reportsResolved.changePercent}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Acciones de moderación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-[var(--color-brown)]">
              {analytics.moderationActions.current}
            </p>
            <ChangeBadge
              current={analytics.moderationActions.current}
              previous={analytics.moderationActions.previous}
              changePercent={analytics.moderationActions.changePercent}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolución — últimos {analytics.periodLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsLineChart
            series={analytics.series.map((s) => ({
              label: s.label,
              color: s.color,
              buckets: s.buckets,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Top productos por evaluaciones ({analytics.periodLabel})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.topProducts.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Sin evaluaciones en este período.
            </p>
          ) : (
            <ol className="space-y-2">
              {analytics.topProducts.map((p, i) => (
                <li
                  key={p.product_id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-5 shrink-0 tabular-nums text-[var(--color-muted-foreground)]">
                      {i + 1}.
                    </span>
                    {p.slug ? (
                      <Link
                        href={`/productos/${p.slug}`}
                        className="truncate font-medium text-[var(--color-primary)] hover:underline"
                        target="_blank"
                      >
                        {p.name}
                      </Link>
                    ) : (
                      <span className="truncate text-[var(--color-brown)]">{p.name}</span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums text-[var(--color-muted-foreground)]">
                    {p.review_count} eval.
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
