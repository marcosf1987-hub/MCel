"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Keyboard, X } from "lucide-react";
import type { Html5Qrcode } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
  onStatus?: (type: "loading" | "success" | "error" | "info", message: string) => void;
}

async function loadHtml5Qrcode() {
  const mod = await import("html5-qrcode");
  const formats = [
    mod.Html5QrcodeSupportedFormats.EAN_13,
    mod.Html5QrcodeSupportedFormats.EAN_8,
    mod.Html5QrcodeSupportedFormats.UPC_A,
    mod.Html5QrcodeSupportedFormats.UPC_E,
    mod.Html5QrcodeSupportedFormats.QR_CODE,
    mod.Html5QrcodeSupportedFormats.CODE_128,
  ];
  return { Html5Qrcode: mod.Html5Qrcode, formats };
}

export function BarcodeScanner({ onScan, disabled, onStatus }: BarcodeScannerProps) {
  const uid = useId().replace(/:/g, "");
  const readerId = `barcode-reader-${uid}`;
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);

  const onScanRef = useRef(onScan);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const decodedRef = useRef(false);

  onScanRef.current = onScan;

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop();
        await scanner.clear();
      } catch {
        /* ignore stop races */
      }
    }
    setCameraActive(false);
    setStartingCamera(false);
  }, []);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (disabled && cameraActive) void stopCamera();
  }, [disabled, cameraActive, stopCamera]);

  const handleDecoded = useCallback(
    (decoded: string) => {
      const code = decoded.replace(/\D/g, "");
      const finalCode = code.length >= 8 ? code : decoded;
      onStatus?.("success", `Código leído: ${finalCode}`);
      onScanRef.current(finalCode);
    },
    [onStatus]
  );

  const startLiveScan = async () => {
    if (disabled || cameraActive || startingCamera) return;
    setError(null);
    setHint(null);
    decodedRef.current = false;
    setStartingCamera(true);
    onStatus?.("info", "Activando cámara…");

    try {
      const { Html5Qrcode, formats } = await loadHtml5Qrcode();
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) {
        throw new Error("NO_CAMERA");
      }

      const back = cameras.find((c) => /back|rear|environment|trasera/i.test(c.label));
      const cameraId = back?.id ?? cameras[cameras.length - 1]?.id ?? cameras[0].id;

      setCameraActive(true);
      setStartingCamera(false);
      setHint("Apuntá al código de barras dentro del recuadro");

      await new Promise((r) => requestAnimationFrame(r));

      const scanner = new Html5Qrcode(readerId, {
        formatsToSupport: formats,
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 280, height: 110 },
          aspectRatio: 1.5,
        },
        (decoded) => {
          if (decodedRef.current) return;
          decodedRef.current = true;
          void (async () => {
            await stopCamera();
            setHint(null);
            handleDecoded(decoded);
          })();
        },
        () => {
          /* sin código en este frame */
        }
      );
    } catch (err) {
      await stopCamera();
      const errMsg =
        err instanceof Error && err.message === "NO_CAMERA"
          ? "No encontramos cámara en este dispositivo. Ingresá el código manualmente."
          : "No pudimos abrir la cámara. Revisá los permisos o ingresá el código manualmente.";
      setError(errMsg);
      onStatus?.("error", errMsg);
    }
  };

  return (
    <div className="space-y-4">
      {cameraActive ? (
        <div className="space-y-3">
          <div
            id={readerId}
            className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black [&_video]:rounded-2xl"
          />
          {hint && (
            <p className="text-center text-sm text-[var(--color-muted-foreground)]">
              {hint}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={disabled}
            onClick={() => void stopCamera()}
          >
            <X className="h-4 w-4" />
            Cancelar escaneo
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="accent"
          size="lg"
          disabled={disabled || startingCamera}
          className="h-12 w-full gap-2 text-base"
          onClick={() => void startLiveScan()}
        >
          <Camera className="h-6 w-6" />
          {startingCamera ? "Abriendo cámara…" : "Escanear código"}
        </Button>
      )}

      {!cameraActive && hint && (
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
            disabled={disabled || cameraActive}
            inputMode="numeric"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="default"
            disabled={!manualCode.trim() || disabled || cameraActive}
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
