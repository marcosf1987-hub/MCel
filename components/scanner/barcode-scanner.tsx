"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, ImageIcon, Keyboard } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
}

function isSecureContext(): boolean {
  if (typeof window === "undefined") return true;
  return window.isSecureContext;
}

export function BarcodeScanner({ onScan, disabled }: BarcodeScannerProps) {
  const uid = useId().replace(/:/g, "");
  const readerId = `barcode-reader-${uid}`;
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const handleDecoded = useCallback(
    async (decoded: string) => {
      await stopScanner();
      const code = decoded.replace(/\D/g, "");
      if (code.length >= 8) {
        onScanRef.current(code);
      } else {
        onScanRef.current(decoded);
      }
    },
    [stopScanner]
  );

  const pickBackCamera = useCallback(async (): Promise<string | { facingMode: string }> => {
    const { Html5Qrcode } = await import("html5-qrcode");
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (cameras.length === 0) {
        return { facingMode: "environment" };
      }
      const back = cameras.find((c) =>
        /back|rear|trasera|environment|wide/i.test(c.label)
      );
      return (back ?? cameras[cameras.length - 1]).id;
    } catch {
      return { facingMode: "environment" };
    }
  }, []);

  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;

    const start = async () => {
      setError(null);
      setHint("Solicitando acceso a la cámara…");

      if (!isSecureContext()) {
        setError(
          "La cámara solo funciona con HTTPS. Abrí el sitio con https:// (Vercel) o ingresá el código manualmente."
        );
        setScanning(false);
        return;
      }

      await new Promise((r) => setTimeout(r, 150));
      if (cancelled) return;

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
          "html5-qrcode"
        );

        const formats = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ];

        const scanner = new Html5Qrcode(readerId, {
          formatsToSupport: formats,
          verbose: false,
        });
        scannerRef.current = scanner;

        const cameraId = await pickBackCamera();

        await scanner.start(
          cameraId,
          {
            fps: 10,
            aspectRatio: 1.777778,
            qrbox: (viewWidth, viewHeight) => {
              const w = Math.min(viewWidth * 0.9, 320);
              const h = Math.min(viewHeight * 0.45, 160);
              return { width: Math.floor(w), height: Math.floor(h) };
            },
            disableFlip: false,
          },
          (text) => {
            void handleDecoded(text);
          },
          () => {}
        );

        if (!cancelled) {
          setHint("Apuntá al código de barras del producto");
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Scanner error:", msg);
        setError(
          msg.includes("NotAllowed") || msg.includes("Permission")
            ? "Permiso de cámara denegado. Activá la cámara en Ajustes del navegador o usá «Foto del código» abajo."
            : msg.includes("NotFound") || msg.includes("device")
              ? "No se encontró cámara. Usá «Foto del código» o ingresá el número manualmente."
              : "No se pudo abrir la cámara. Probá «Foto del código» o el ingreso manual."
        );
        setScanning(false);
        scannerRef.current = null;
      }
    };

    void start();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [scanning, readerId, pickBackCamera, handleDecoded, stopScanner]);

  const startScanner = () => {
    if (disabled) return;
    setError(null);
    setHint(null);
    setScanning(true);
  };

  const scanFromPhoto = async (file: File) => {
    setError(null);
    setHint("Leyendo código de la imagen…");
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
      await handleDecoded(result);
    } catch {
      setHint(null);
      setError(
        "No se detectó un código en la foto. Intentá con mejor luz y enfoque, o ingresá el número manualmente."
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Siempre en DOM con tamaño cuando escanea (evita cámara en div oculto de 0px) */}
      <div
        className={
          scanning
            ? "relative min-h-[280px] w-full overflow-hidden rounded-2xl border-2 border-[var(--color-accent)] bg-black"
            : "sr-only h-0 w-0 overflow-hidden"
        }
        aria-hidden={!scanning}
      >
        <div id={readerId} className={scanning ? "min-h-[280px] w-full [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover" : "h-px w-px"} />
        {hint && scanning && !error && (
          <p className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-2 text-center text-xs text-white">
            {hint}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!scanning ? (
          <Button type="button" onClick={startScanner} disabled={disabled} className="gap-2">
            <Camera className="h-4 w-4" />
            Abrir cámara
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={() => void stopScanner()}>
            Cerrar cámara
          </Button>
        )}

        <Button type="button" variant="secondary" disabled={disabled} className="gap-2" asChild>
          <label className="cursor-pointer">
            <ImageIcon className="h-4 w-4" />
            Foto del código
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
      </div>

      {!isSecureContext() && typeof window !== "undefined" && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
          En el celular, la cámara en vivo requiere HTTPS. Usá la URL de Vercel o «Foto del código».
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
            onClick={() => onScan(manualCode.trim())}
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
