import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchAdminAnalytics } from "@/lib/admin/analytics-server";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export const metadata = { title: "Métricas — Admin" };

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = params.range ?? "30d";
  const supabase = await createClient();
  const analytics = await fetchAdminAnalytics(supabase, range);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
          Métricas
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          KPIs con evolución temporal y comparación vs el período anterior.
        </p>
      </div>

      <AnalyticsDashboard initialAnalytics={analytics} />

      <Link
        href="/admin"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        ← Volver al resumen
      </Link>
    </div>
  );
}
