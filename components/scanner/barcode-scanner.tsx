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

async function waitForContainerSize(
  elementId: string,
  minSize = 48,
  maxAttempts = 30
): Promise<{ width: number; height: number }> {
  for (let i = 0; i < maxAttempts; i += 1) {
    const el = document.getElementById(elementId);
    const rect = el?.getBoundingClientRect();
    if (rect && rect.width >= minSize && rect.height >= minSize) {
      return { width: rect.width, height: rect.height };
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
  throw new Error("NO_CONTAINER_SIZE");
}

const READY_HINT = "Apuntá al código de barras dentro del recuadro";

function buildScanConfig(isApple: boolean) {
  if (isApple) {
    return {
      fps: 8,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
        width: Math.floor(viewfinderWidth * 0.9),
        height: Math.min(140, Math.floor(viewfinderHeight * 0.35)),
      }),
      videoConstraints: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };
  }

  return {
    fps: 10,
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
      const width = Math.min(280, Math.floor(viewfinderWidth * 0.92));
      const height = Math.min(120, Math.floor(viewfinderHeight * 0.35));
      return { width, height: Math.max(64, height) };
    },
  };
}

async function applyIosFocusIfSupported(scanner: Html5Qrcode) {
  if (!isAppleMobile()) return;
  try {
    await scanner.applyVideoConstraints({
      advanced: [{ focusMode: "continuous" }],
    } as MediaTrackConstraints);
    agentLog("H3", "barcode-scanner:focus", "applied continuous focus", {});
  } catch (err) {
    agentLog("H3", "barcode-scanner:focus", "focus constraints skipped", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function isDebugScanner(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.search.includes("debugScanner");
}

function agentLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown> = {}
) {
  const payload = {
    sessionId: "8de89c",
    runId: "post-fix",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  // #region agent log
  fetch("http://127.0.0.1:7732/ingest/3790f503-df5e-4315-a24e-28885c27c3fb", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "8de89c",
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
  if (isDebugScanner()) {
    try {
      const key = "debugScanner:8de89c";
      const prev = JSON.parse(sessionStorage.getItem(key) ?? "[]") as string[];
      prev.push(`${new Date().toISOString().slice(11, 23)} [${hypothesisId}] ${message}`);
      sessionStorage.setItem(key, JSON.stringify(prev.slice(-40)));
    } catch {
      /* ignore */
    }
  }
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
  const [debugLines, setDebugLines] = useState<string[]>([]);

  const onScanRef = useRef(onScan);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const decodedRef = useRef(false);
  const startRequestRef = useRef(0);
  const scanErrorCountRef = useRef(0);

  const pushDebug = useCallback((line: string) => {
    if (!isDebugScanner()) return;
    setDebugLines((prev) => [...prev.slice(-39), line]);
  }, []);

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
    scanErrorCountRef.current = 0;
    startRequestRef.current += 1;
    const requestId = startRequestRef.current;
    setStartingCamera(true);
    onStatus?.("info", "Activando cámara…");
    agentLog("H1", "barcode-scanner:startLiveScan", "button clicked", {
      requestId,
      isApple: isAppleMobile(),
      disabled,
    });
    pushDebug(`click req=${requestId}`);

    void (async () => {
      try {
        agentLog("H2", "barcode-scanner:loadLib", "loading html5-qrcode", { requestId });
        const { Html5Qrcode, formats } = await loadHtml5Qrcode();
        if (requestId !== startRequestRef.current) {
          agentLog("H4", "barcode-scanner:cancelled", "after loadLib", { requestId });
          return;
        }

        setCameraActive(true);
        pushDebug("cameraActive=true");
        await waitForDom();
        if (requestId !== startRequestRef.current) {
          agentLog("H4", "barcode-scanner:cancelled", "after waitForDom", { requestId });
          return;
        }

        let containerSize: { width: number; height: number };
        try {
          containerSize = await waitForContainerSize(readerId);
        } catch {
          throw new Error("NO_CONTAINER");
        }
        agentLog("H5", "barcode-scanner:container", "container ready", {
          requestId,
          ...containerSize,
        });
        pushDebug(`container ${containerSize.width}x${containerSize.height}`);

        const camera = await resolveCamera(Html5Qrcode);
        agentLog("H2", "barcode-scanner:camera", "camera resolved", {
          requestId,
          camera: typeof camera === "string" ? camera : camera.facingMode,
        });
        pushDebug(`camera=${typeof camera === "string" ? camera : camera.facingMode}`);
        if (requestId !== startRequestRef.current) {
          agentLog("H4", "barcode-scanner:cancelled", "after resolveCamera", { requestId });
          return;
        }

        setStartingCamera(false);
        setHint(READY_HINT);
        onStatus?.("info", READY_HINT);

        const isApple = isAppleMobile();
        const scanner = new Html5Qrcode(readerId, {
          formatsToSupport: formats,
          verbose: isDebugScanner(),
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: !isApple,
          },
        });
        scannerRef.current = scanner;

        const scanConfig = buildScanConfig(isApple);
        agentLog("H3", "barcode-scanner:config", "scan config", {
          requestId,
          isApple,
          scanConfig,
        });

        const onDecode = (decoded: string) => {
          agentLog("H3", "barcode-scanner:decode", "barcode decoded", {
            requestId,
            length: decoded.length,
            scanErrors: scanErrorCountRef.current,
          });
          pushDebug(`DECODED len=${decoded.length}`);
          if (decodedRef.current) return;
          decodedRef.current = true;
          void (async () => {
            await stopCamera();
            handleDecoded(decoded);
          })();
        };

        const onScanError = () => {
          scanErrorCountRef.current += 1;
          if (scanErrorCountRef.current === 1 || scanErrorCountRef.current % 50 === 0) {
            agentLog("H3", "barcode-scanner:scanError", "scan frame without decode", {
              requestId,
              count: scanErrorCountRef.current,
            });
            pushDebug(`scanErrors=${scanErrorCountRef.current}`);
          }
        };

        try {
          agentLog("H2", "barcode-scanner:start", "calling scanner.start primary", { requestId });
          pushDebug("start(primary)…");
          await scanner.start(camera, scanConfig, onDecode, onScanError);
          agentLog("H2", "barcode-scanner:startDone", "scanner.start resolved", {
            requestId,
            isScanning: scanner.isScanning,
          });
          pushDebug(`startDone scanning=${scanner.isScanning}`);
          await applyIosFocusIfSupported(scanner);
          onStatus?.("info", READY_HINT);
          agentLog("H1", "barcode-scanner:ready", "camera ready", {
            requestId,
            isScanning: scanner.isScanning,
          });
        } catch (firstErr) {
          agentLog("H2", "barcode-scanner:startFail", "primary start failed", {
            requestId,
            error: firstErr instanceof Error ? firstErr.message : String(firstErr),
          });
          pushDebug(`startFail: ${firstErr instanceof Error ? firstErr.message : "unknown"}`);
          if (typeof camera === "string") throw firstErr;
          agentLog("H2", "barcode-scanner:start", "calling scanner.start fallback", { requestId });
          await scanner.start({ facingMode: "environment" }, scanConfig, onDecode, onScanError);
          agentLog("H2", "barcode-scanner:startDone", "fallback start resolved", {
            requestId,
            isScanning: scanner.isScanning,
          });
          pushDebug(`fallbackDone scanning=${scanner.isScanning}`);
          await applyIosFocusIfSupported(scanner);
          onStatus?.("info", READY_HINT);
        }
      } catch (err) {
        if (requestId !== startRequestRef.current) return;
        agentLog("H2", "barcode-scanner:catch", "startLiveScan failed", {
          requestId,
          error: err instanceof Error ? err.message : String(err),
          name: err instanceof Error ? err.name : "unknown",
        });
        pushDebug(`ERROR: ${err instanceof Error ? err.message : "unknown"}`);
        await stopCamera();

        const isPermission =
          err instanceof Error &&
          (/permission|notallowed|denied/i.test(err.message) ||
            err.name === "NotAllowedError");

        const errMsg = isPermission
          ? isAppleMobile()
            ? "Safari bloqueó la cámara. Andá a Ajustes → Safari → Cámara (o la app CeliApp) y permití el acceso, luego recargá la página."
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
          className="min-h-[260px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black [&_video]:rounded-2xl [&_video]:min-h-[240px]"
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

      {isDebugScanner() && debugLines.length > 0 && (
        <pre className="max-h-32 overflow-auto rounded border border-amber-300 bg-amber-50 p-2 text-[10px] leading-tight text-amber-950">
          {debugLines.join("\n")}
        </pre>
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
