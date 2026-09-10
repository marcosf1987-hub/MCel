"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const SHOW_DELAY_MS = 5000;

function isPreviewMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("pwaPreview") === "1";
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [preview, setPreview] = useState(false);
  const [delayDone, setDelayDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const previewMode = isPreviewMode();
    setPreview(previewMode);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (!previewMode) {
      const dismissedBefore = localStorage.getItem("pwa-install-dismissed");
      if (dismissedBefore) setDismissed(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const timer = window.setTimeout(() => setDelayDone(true), SHOW_DELAY_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.clearTimeout(timer);
    };
  }, []);

  const canShow = preview || Boolean(deferred);
  const visible =
    delayDone && canShow && !dismissed && (preview || !isStandalone);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  if (!visible) return null;

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setDeferred(null);
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (!preview) {
      localStorage.setItem("pwa-install-dismissed", "1");
    }
    setDeferred(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Instalar aplicación"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={handleDismiss}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--color-brand-light)] bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-[var(--color-muted-foreground)] hover:text-[var(--color-brown)]"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="pr-6">
          <p className="font-[family-name:var(--font-headline)] text-xl font-bold text-[var(--color-brown)]">
            Instalá CeliApp
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            Accedé más rápido desde tu pantalla de inicio, como una app.
          </p>
          {preview && !deferred && (
            <p className="mt-2 text-xs text-[var(--color-accent)]">
              Preview local — el botón de instalar solo funciona si el navegador
              ofrece instalación PWA.
            </p>
          )}
        </div>
        <Button
          className="mt-5 w-full gap-2"
          variant="accent"
          onClick={handleInstall}
          disabled={!deferred}
        >
          <Download className="h-4 w-4" />
          Agregar a inicio
        </Button>
      </div>
    </div>
  );
}
