"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const dismissedBefore = localStorage.getItem("pwa-install-dismissed");
    if (dismissedBefore) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed || !deferred) return null;

  const handleInstall = async () => {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setDeferred(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "1");
    setDeferred(null);
  };

  return (
    <div
      role="region"
      aria-label="Instalar aplicación"
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-[var(--color-brand-light)] bg-white p-4 shadow-lg md:bottom-4 sm:left-auto sm:right-4"
    >
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="font-semibold text-[var(--color-brown)]">Instalá Celíacos AR</p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Accedé más rápido desde tu pantalla de inicio, como una app.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 text-[var(--color-muted-foreground)]"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <Button className="mt-3 w-full gap-2" variant="accent" onClick={handleInstall}>
        <Download className="h-4 w-4" />
        Agregar a inicio
      </Button>
    </div>
  );
}
