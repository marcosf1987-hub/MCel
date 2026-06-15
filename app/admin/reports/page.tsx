import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session-profile";
import { fetchEnrichedReports } from "@/lib/admin/reports-server";
import { ReportQueue } from "@/components/admin/report-queue";
import Link from "next/link";

export const metadata = { title: "Reportes — Admin" };

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const auth = await requireRole(supabase, "moderator");
  if (!auth.ok) return null;

  const reports = await fetchEnrichedReports(supabase, "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
          Cola de reportes
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Revisá denuncias de productos, evaluaciones y listas. Podés ocultar
          contenido (soft delete) o descartar reportes sin acción.
        </p>
      </div>

      <ReportQueue initialReports={reports} initialStatus="pending" />

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Todas las acciones quedan registradas en{" "}
        <code className="rounded bg-white px-1">admin_audit_log</code>.{" "}
        <Link href="/admin" className="text-[var(--color-primary)] hover:underline">
          Volver al resumen
        </Link>
      </p>
    </div>
  );
}
