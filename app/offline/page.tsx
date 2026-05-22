import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OfflineRetry } from "@/app/offline/offline-retry";
import { WifiOff } from "lucide-react";

export const metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-cream)]">
        <WifiOff className="h-8 w-8 text-[var(--color-accent)]" />
      </div>
      <h1 className="text-xl font-bold text-[var(--color-brown)]">Sin conexión</h1>
      <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
        No hay internet. Revisá tu red y volvé a intentar. Algunas páginas que ya
        visitaste pueden abrirse desde la caché.
      </p>
      <Button asChild className="mt-8" variant="accent">
        <Link href="/">Ir al inicio</Link>
      </Button>
      <OfflineRetry />
    </div>
  );
}
