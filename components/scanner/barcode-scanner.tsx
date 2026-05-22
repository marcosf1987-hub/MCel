"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
}

export function BarcodeScanner({ onScan, disabled }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerId = "barcode-reader";

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    setScanning(false);
  };

  const startScanner = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decoded) => {
          stopScanner();
          onScan(decoded);
        },
        () => {}
      );
      setScanning(true);
    } catch (e) {
      setError(
        "No se pudo acceder a la cámara. Ingresá el código manualmente o revisá los permisos."
      );
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        id={readerId}
        className={`overflow-hidden rounded-lg border ${scanning ? "block" : "hidden"}`}
      />
      <div className="flex flex-wrap gap-2">
        {!scanning ? (
          <Button type="button" onClick={startScanner} disabled={disabled}>
            Escanear código de barras
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={stopScanner}>
            Detener escáner
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="manual-barcode">O ingresá el código manualmente</Label>
        <div className="flex gap-2">
          <Input
            id="manual-barcode"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="7790000000000"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!manualCode.trim() || disabled}
            onClick={() => onScan(manualCode.trim())}
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
