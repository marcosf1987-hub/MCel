"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReportTargetType } from "@/types/database";

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: ReportTargetType;
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("Reporte enviado. Gracias.");
        setOpen(false);
        setReason("");
      } else if (res.status === 401) {
        setStatus("Debés iniciar sesión para reportar.");
      } else {
        setStatus(
          typeof data.error === "string" ? data.error : "No se pudo enviar el reporte."
        );
      }
    } catch {
      setStatus("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <div className="inline-flex flex-col items-start gap-1">
        <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(true)}>
          Reportar
        </Button>
        {status && (
          <span className="text-xs text-[var(--color-muted-foreground)]">{status}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Motivo del reporte"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="max-w-xs"
        disabled={loading}
      />
      <Button
        size="sm"
        type="button"
        onClick={() => void submit()}
        disabled={!reason.trim() || loading}
      >
        Enviar
      </Button>
      <Button
        size="sm"
        variant="ghost"
        type="button"
        disabled={loading}
        onClick={() => {
          setOpen(false);
          setReason("");
        }}
      >
        Cancelar
      </Button>
      {status && (
        <span className="text-xs text-[var(--color-muted-foreground)]">{status}</span>
      )}
    </div>
  );
}
