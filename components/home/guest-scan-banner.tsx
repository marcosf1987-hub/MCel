import Link from "next/link";
import { Camera, QrCode } from "lucide-react";

/** Banner rápido de escáner para el home guest (estilo coral de marca). */
export function GuestScanBanner() {
  return (
    <section className="mb-8 px-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-hover)] to-[var(--color-primary-dark)] p-5 text-white shadow-md">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10 blur-xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 rounded-full bg-white/10"
          aria-hidden
        />
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <QrCode className="h-6 w-6" />
            </div>
            <span className="rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
              En góndola
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold leading-snug">Escaneá y verificá al instante</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-white/90">
              Apuntá la cámara al código de barras de un producto para poder evaluarlo o para ver
              las valoraciones de la comunidad.
            </p>
          </div>
          <Link
            href="/productos/nuevo"
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-[16px] font-bold text-[var(--color-primary)] shadow-md transition-transform active:scale-[0.98]"
          >
            <Camera className="h-5 w-5" />
            Abrir escáner
          </Link>
        </div>
      </div>
    </section>
  );
}
