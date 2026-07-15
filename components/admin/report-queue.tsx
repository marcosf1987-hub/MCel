"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EnrichedReport } from "@/lib/admin/reports-server";
import { TARGET_TYPE_LABELS } from "@/lib/admin/reports-server";
import type { Report } from "@/types/database";
import { Loader2 } from "lucide-react";

const STATUS_TABS: { value: Report["status"] | "all"; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "resolved", label: "Resueltos" },
  { value: "dismissed", label: "Descartados" },
  { value: "all", label: "Todos" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ReportQueue({
  initialReports,
  initialStatus = "pending",
}: {
  initialReports: EnrichedReport[];
  initialStatus?: Report["status"] | "all";
}) {
  const [status, setStatus] = useState<Report["status"] | "all">(initialStatus);
  const [reports, setReports] = useState(initialReports);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async (nextStatus: Report["status"] | "all") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports?status=${nextStatus}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudieron cargar los reportes.");
        return;
      }
      setReports(data.reports as EnrichedReport[]);
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status !== initialStatus) {
      void loadReports(status);
    }
  }, [status, initialStatus, loadReports]);

  const handleAction = async (
    reportId: string,
    action: "resolved" | "dismissed",
    hideContent: boolean
  ) => {
    setActingId(reportId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: action,
          hideContent,
          moderatorNote: notes[reportId] ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo procesar el reporte.");
        return;
      }
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch {
      setError("Error de conexión.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            variant={status === tab.value ? "default" : "outline"}
            onClick={() => setStatus(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
        {loading && <Loader2 className="h-4 w-4 animate-spin self-center text-[var(--color-muted-foreground)]" />}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {reports.length === 0 && !loading ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No hay reportes en esta categoría.
        </p>
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li key={report.id}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-[var(--color-brown)]">
                      {TARGET_TYPE_LABELS[report.target_type]} reportado
                    </CardTitle>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {formatDate(report.created_at)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-[var(--color-brown)]">
                    <span className="font-medium">Motivo:</span> {report.reason}
                  </p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Reportado por {report.reporter_name ?? "usuario"} ·{" "}
                    {report.target_label}
                    {report.target_deleted && (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-900">
                        Oculto
                      </span>
                    )}
                  </p>
                  {report.target_href && (
                    <Link
                      href={report.target_href}
                      className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                      target="_blank"
                    >
                      Ver contenido →
                    </Link>
                  )}
                  {report.status === "pending" && (
                    <>
                      <Textarea
                        placeholder="Nota interna (opcional)"
                        value={notes[report.id] ?? ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                        }
                        rows={2}
                        disabled={actingId === report.id}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={actingId === report.id}
                          onClick={() => handleAction(report.id, "resolved", true)}
                        >
                          Resolver y ocultar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={actingId === report.id}
                          onClick={() => handleAction(report.id, "resolved", false)}
                        >
                          Resolver sin ocultar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={actingId === report.id}
                          onClick={() => handleAction(report.id, "dismissed", false)}
                        >
                          Descartar
                        </Button>
                      </div>
                    </>
                  )}
                  {report.status !== "pending" && report.moderator_note && (
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      Nota: {report.moderator_note}
                    </p>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
