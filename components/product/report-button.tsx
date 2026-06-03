"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "product" | "review" | "list";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: targetType, target_id: targetId, reason }),
    });
    if (res.ok) {
      setStatus("Reporte enviado. Gracias.");
      setOpen(false);
    } else {
      setStatus("Debés iniciar sesión para reportar.");
    }
  };

  if (!open) {
    return (
      <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(true)}>
        Reportar
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Motivo del reporte"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="max-w-xs"
      />
      <Button size="sm" type="button" onClick={submit} disabled={!reason.trim()}>
        Enviar
      </Button>
      <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
      {status && <span className="text-xs">{status}</span>}
    </div>
  );
}
