"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Keyboard, ScanBarcode } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
  onStatus?: (type: "loading" | "success" | "error" | "info", message: string) => void;
}

export function BarcodeScanner({ onScan, disabled, onStatus }: BarcodeScannerProps) {
  const uid = useId().replace(/:/g, "");
  const readerId = `barcode-reader-${uid}`;
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const handleDecoded = useCallback(
    (decoded: string) => {
      const code = decoded.replace(/\D/g, "");
      const finalCode = code.length >= 8 ? code : decoded;
      onStatus?.("success", `Código leído: ${finalCode}`);
      onScanRef.current(finalCode);
    },
    [onStatus]
  );

  const scanFromPhoto = async (file: File) => {
    setError(null);
    setHint("Leyendo código de la imagen…");
    onStatus?.("loading", "Analizando foto del código…");
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        "html5-qrcode"
      );
      const formats = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
      ];
      const scanner = new Html5Qrcode(readerId, {
        formatsToSupport: formats,
        verbose: false,
      });
      const result = await scanner.scanFile(file, true);
      scanner.clear();
      setHint(null);
      handleDecoded(result);
    } catch {
      setHint(null);
      const errMsg =
        "No se detectó un código en la foto. Intentá con mejor luz y enfoque, o ingresá el número manualmente.";
      setError(errMsg);
      onStatus?.("error", errMsg);
    }
  };

  return (
    <div className="space-y-4">
      <div id={readerId} className="sr-only h-px w-px overflow-hidden" aria-hidden />

      <Button
        type="button"
        variant="accent"
        size="lg"
        disabled={disabled}
        className="h-12 w-full gap-2 text-base"
        asChild
      >
        <label className="cursor-pointer">
          <ScanBarcode className="h-6 w-6" />
          Escanear código de barra
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void scanFromPhoto(file);
              e.target.value = "";
            }}
          />
        </label>
      </Button>

      {hint && (
        <p className="text-center text-sm text-[var(--color-muted-foreground)]">
          {hint}
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-brand-cream)] p-4">
        <Label htmlFor={`manual-${uid}`} className="flex items-center gap-2">
          <Keyboard className="h-4 w-4" />
          Ingresar código manualmente
        </Label>
        <div className="flex gap-2">
          <Input
            id={`manual-${uid}`}
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
            placeholder="7790000000000"
            disabled={disabled}
            inputMode="numeric"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="default"
            disabled={!manualCode.trim() || disabled}
            onClick={() => {
              const code = manualCode.trim();
              onStatus?.("loading", `Buscando código ${code}…`);
              onScan(code);
            }}
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
