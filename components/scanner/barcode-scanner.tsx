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

const READY_HINT = "Apuntá al código de barras en el centro del visor";

function buildAndroidScanConfig() {
  return {
    fps: 10,
    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
      const width = Math.min(280, Math.floor(viewfinderWidth * 0.92));
      const height = Math.min(120, Math.floor(viewfinderHeight * 0.35));
      return { width, height: Math.max(64, height) };
    },
  };
}

async function applyVideoFocus(videoEl: HTMLVideoElement | null) {
  if (!videoEl?.srcObject) return;
  const track = (videoEl.srcObject as MediaStream).getVideoTracks()[0];
  if (!track) return;

  try {
    const caps = track.getCapabilities?.() as MediaTrackCapabilities & {
      zoom?: { min: number; max: number };
      focusDistance?: { min: number; max: number };
    };

    const advanced: Record<string, unknown>[] = [{ focusMode: "continuous" }];
    if (caps?.zoom?.max) {
      advanced.push({ zoom: Math.min(2, caps.zoom.max) });
    }
    if (caps?.focusDistance?.max) {
      advanced.push({ focusDistance: Math.min(1, caps.focusDistance.max) });
    }

    await track.applyConstraints({ advanced } as MediaTrackConstraints);
  } catch {
    /* focus not supported */
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
  if (!isDebugScanner()) return;
  const payload = {
    sessionId: "8de89c",
    runId: "zxing-ios",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  fetch("http://127.0.0.1:7732/ingest/3790f503-df5e-4315-a24e-28885c27c3fb", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "8de89c",
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

type CameraConfig = string | { facingMode: string };

async function resolveCamera(
  Html5Qrcode: typeof import("html5-qrcode").Html5Qrcode
): Promise<CameraConfig> {
  try {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras.length) return { facingMode: "environment" };
    const back = cameras.find((c) => /back|rear|environment|trasera/i.test(c.label));
    return back?.id ?? cameras[cameras.length - 1]?.id ?? cameras[0].id;
  } catch {
    return { facingMode: "environment" };
  }
}

async function resolveZxingDeviceId(): Promise<string | undefined> {
  const { BrowserMultiFormatReader } = await import("@zxing/browser");
  const devices = await BrowserMultiFormatReader.listVideoInputDevices();
  if (!devices.length) return undefined;
  const back = devices.find((d) => /back|rear|environment|trasera/i.test(d.label));
  return back?.deviceId ?? devices[devices.length - 1]?.deviceId;
}

type ZxingSession = {
  stop: () => void;
};

async function startZxingScan(
  videoEl: HTMLVideoElement,
  onDecode: (decoded: string) => void
): Promise<ZxingSession> {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import("@zxing/browser"),
    import("@zxing/library"),
  ]);

  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.QR_CODE,
  ]);

  const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 250 });
  let stopped = false;
  let controls: { stop: () => void } | null = null;

  videoEl.setAttribute("playsinline", "true");
  videoEl.setAttribute("webkit-playsinline", "true");
  videoEl.muted = true;

  const onResult = (result: { getText: () => string } | undefined) => {
    if (stopped || !result) return;
    onDecode(result.getText());
  };

  const deviceId = await resolveZxingDeviceId();
  const constraints: MediaStreamConstraints = deviceId
    ? { video: { deviceId: { exact: deviceId } } }
    : {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

  try {
    controls = await reader.decodeFromConstraints(constraints, videoEl, onResult);
  } catch {
    controls = await reader.decodeFromVideoDevice(undefined, videoEl, onResult);
  }

  await new Promise((resolve) => setTimeout(resolve, 400));
  await applyVideoFocus(videoEl);

  return {
    stop: () => {
      stopped = true;
      controls?.stop();
      const stream = videoEl.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
      videoEl.srcObject = null;
    },
  };
}

export function BarcodeScanner({ onScan, disabled, onStatus }: BarcodeScannerProps) {
  const uid = useId().replace(/:/g, "");
  const readerId = `barcode-reader-${uid}`;
  const videoRef = useRef<HTMLVideoElement>(null);
  const useIosZxing = isAppleMobile();

  const [manualCode, setManualCode] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [startingCamera, setStartingCamera] = useState(false);
  const [debugLines, setDebugLines] = useState<string[]>([]);

  const onScanRef = useRef(onScan);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const zxingRef = useRef<ZxingSession | null>(null);
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
    const zxing = zxingRef.current;
    zxingRef.current = null;
    if (zxing) {
      try {
        zxing.stop();
      } catch {
        /* ignore */
      }
    }

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
      startRequestRef.current += 1;
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

  const onDecodeSuccess = useCallback(
    (decoded: string) => {
      if (decodedRef.current) return;
      decodedRef.current = true;
      void (async () => {
        await stopCamera();
        handleDecoded(decoded);
      })();
    },
    [handleDecoded, stopCamera]
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
      useIosZxing,
      disabled,
    });
    pushDebug(`click req=${requestId} ios=${useIosZxing}`);

    void (async () => {
      try {
        setCameraActive(true);
        await waitForDom();
        if (requestId !== startRequestRef.current) return;

        if (useIosZxing) {
          const videoEl = videoRef.current;
          if (!videoEl) throw new Error("NO_CONTAINER");

          agentLog("H2", "barcode-scanner:zxing", "starting zxing", { requestId });
          pushDebug("zxing start…");

          setStartingCamera(false);
          setHint(READY_HINT);
          onStatus?.("info", READY_HINT);

          const session = await startZxingScan(videoEl, (decoded) => {
            agentLog("H3", "barcode-scanner:zxingDecode", "decoded", {
              requestId,
              length: decoded.length,
            });
            pushDebug(`DECODED len=${decoded.length}`);
            onDecodeSuccess(decoded);
          });

          if (requestId !== startRequestRef.current) {
            session.stop();
            return;
          }

          zxingRef.current = session;
          agentLog("H1", "barcode-scanner:ready", "zxing ready", { requestId });
          pushDebug("zxing ready");
          return;
        }

        const { Html5Qrcode, formats } = await loadHtml5Qrcode();
        if (requestId !== startRequestRef.current) return;

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

        const camera = await resolveCamera(Html5Qrcode);
        if (requestId !== startRequestRef.current) return;

        setStartingCamera(false);
        setHint(READY_HINT);
        onStatus?.("info", READY_HINT);

        const scanner = new Html5Qrcode(readerId, {
          formatsToSupport: formats,
          verbose: isDebugScanner(),
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });
        scannerRef.current = scanner;

        const scanConfig = buildAndroidScanConfig();

        const onDecode = (decoded: string) => {
          agentLog("H3", "barcode-scanner:decode", "barcode decoded", {
            requestId,
            length: decoded.length,
            scanErrors: scanErrorCountRef.current,
          });
          onDecodeSuccess(decoded);
        };

        const onScanError = () => {
          scanErrorCountRef.current += 1;
        };

        try {
          await scanner.start(camera, scanConfig, onDecode, onScanError);
          const videoEl = document
            .getElementById(readerId)
            ?.querySelector("video") as HTMLVideoElement | null;
          await applyVideoFocus(videoEl);
          onStatus?.("info", READY_HINT);
        } catch (firstErr) {
          if (typeof camera === "string") throw firstErr;
          await scanner.start({ facingMode: "environment" }, scanConfig, onDecode, onScanError);
          const videoEl = document
            .getElementById(readerId)
            ?.querySelector("video") as HTMLVideoElement | null;
          await applyVideoFocus(videoEl);
          onStatus?.("info", READY_HINT);
        }
      } catch (err) {
        if (requestId !== startRequestRef.current) return;
        agentLog("H2", "barcode-scanner:catch", "startLiveScan failed", {
          requestId,
          error: err instanceof Error ? err.message : String(err),
        });
        pushDebug(`ERROR: ${err instanceof Error ? err.message : "unknown"}`);
        await stopCamera();

        const isPermission =
          err instanceof Error &&
          (/permission|notallowed|denied/i.test(err.message) ||
            err.name === "NotAllowedError");

        const errMsg = isPermission
          ? useIosZxing
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
      <div
        className={
          cameraActive
            ? "space-y-3"
            : "pointer-events-none fixed -left-[9999px] h-px w-px overflow-hidden opacity-0"
        }
        aria-hidden={!cameraActive}
      >
        {useIosZxing ? (
          <video
            ref={videoRef}
            className="min-h-[260px] w-full rounded-2xl border border-[var(--color-border)] bg-black object-cover"
            playsInline
            muted
            autoPlay
          />
        ) : (
          <div
            id={readerId}
            className="min-h-[260px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black [&_video]:min-h-[240px] [&_video]:rounded-2xl"
          />
        )}
        {cameraActive && hint && (
          <p className="text-center text-sm text-[var(--color-muted-foreground)]">{hint}</p>
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
