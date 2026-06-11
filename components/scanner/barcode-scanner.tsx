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
  onStatus?: (type: "loading" | "success" | "error" | "info" | "idle", message: string) => void;
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

function isAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function waitForDom(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

type CameraConfig = string | { facingMode: string };

async function resolveCamera(
  Html5Qrcode: typeof import("html5-qrcode").Html5Qrcode
): Promise<CameraConfig> {
  if (isAppleMobile()) {
    return { facingMode: "environment" };
  }

  try {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras.length) return { facingMode: "environment" };
    const back = cameras.find((c) => /back|rear|environment|trasera/i.test(c.label));
    return back?.id ?? cameras[cameras.length - 1]?.id ?? cameras[0].id;
  } catch {
    return { facingMode: "environment" };
  }
}

export function BarcodeScanner({ onScan, disabled, onStatus }: BarcodeScannerProps) {
  const uid = useId().replace(/:/g, "");
  const readerId = `barcode-reader-${uid}`;
  const [manualCode, setManualCode] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);

  const onScanRef = useRef(onScan);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const decodedRef = useRef(false);
  const startRequestRef = useRef(0);

  onScanRef.current = onScan;

  const reportError = useCallback(
    (message: string) => {
      onStatus?.("error", message);
    },
    [onStatus]
  );

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
    setHint(null);
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

  const startLiveScan = () => {
    if (disabled || cameraActive || startingCamera) return;
    decodedRef.current = false;
    startRequestRef.current += 1;
    const requestId = startRequestRef.current;
    setStartingCamera(true);
    onStatus?.("info", "Activando cámara…");

    void (async () => {
      try {
        const { Html5Qrcode, formats } = await loadHtml5Qrcode();
        if (requestId !== startRequestRef.current) return;

        setCameraActive(true);
        await waitForDom();
        if (requestId !== startRequestRef.current) return;

        const container = document.getElementById(readerId);
        if (!container) {
          throw new Error("NO_CONTAINER");
        }

        const camera = await resolveCamera(Html5Qrcode);
        if (requestId !== startRequestRef.current) return;

        setStartingCamera(false);
        setHint("Apuntá al código de barras dentro del recuadro");

        const scanner = new Html5Qrcode(readerId, {
          formatsToSupport: formats,
          verbose: false,
        });
        scannerRef.current = scanner;

        const scanConfig = {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.min(280, Math.floor(viewfinderWidth * 0.92));
            const height = Math.min(120, Math.floor(viewfinderHeight * 0.35));
            return { width, height: Math.max(64, height) };
          },
        };

        try {
          await scanner.start(
            camera,
            scanConfig,
            (decoded) => {
              if (decodedRef.current) return;
              decodedRef.current = true;
              void (async () => {
                await stopCamera();
                handleDecoded(decoded);
              })();
            },
            () => {
              /* sin código en este frame */
            }
          );
        } catch (firstErr) {
          if (typeof camera === "string") throw firstErr;
          await scanner.start(
            { facingMode: "environment" },
            scanConfig,
            (decoded) => {
              if (decodedRef.current) return;
              decodedRef.current = true;
              void (async () => {
                await stopCamera();
                handleDecoded(decoded);
              })();
            },
            () => {}
          );
        }
      } catch (err) {
        if (requestId !== startRequestRef.current) return;
        await stopCamera();

        const isPermission =
          err instanceof Error &&
          (/permission|notallowed|denied/i.test(err.message) ||
            err.name === "NotAllowedError");

        const errMsg = isPermission
          ? isAppleMobile()
            ? "Safari bloqueó la cámara. Andá a Ajustes → Safari → Cámara (o la app Celíacos) y permití el acceso, luego recargá la página."
            : "Permiso de cámara denegado. Permití el acceso en el navegador e intentá de nuevo."
          : err instanceof Error && err.message === "NO_CONTAINER"
            ? "No pudimos preparar el visor. Intentá de nuevo."
            : "No pudimos abrir la cámara. Revisá los permisos o ingresá el código manualmente.";

        reportError(errMsg);
      }
    })();
  };

  const cancelScan = () => {
    startRequestRef.current += 1;
    void stopCamera();
    onStatus?.("idle", "");
  };

  return (
    <div className="space-y-4">
      {/* Siempre montado: en iPhone el visor debe existir antes de scanner.start() */}
      <div
        className={
          cameraActive
            ? "space-y-3"
            : "pointer-events-none fixed -left-[9999px] h-px w-px overflow-hidden opacity-0"
        }
        aria-hidden={!cameraActive}
      >
        <div
          id={readerId}
          className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black [&_video]:rounded-2xl"
        />
        {cameraActive && hint && (
          <p className="text-center text-sm text-[var(--color-muted-foreground)]">
            {hint}
          </p>
        )}
        {cameraActive && (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={disabled}
            onClick={cancelScan}
          >
            <X className="h-4 w-4" />
            Cancelar escaneo
          </Button>
        )}
      </div>

      {!cameraActive && (
        <Button
          type="button"
          variant="accent"
          size="lg"
          disabled={disabled || startingCamera}
          className="h-12 w-full gap-2 text-base"
          onClick={startLiveScan}
        >
          <Camera className="h-6 w-6" />
          {startingCamera ? "Abriendo cámara…" : "Escanear código"}
        </Button>
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
