import Link from "next/link";
import { QrCode, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScanCtaBanner({ variant }: { variant: "guest" | "authed" }) {
  const secondaryHref = variant === "authed" ? "/productos" : "/login";
  const secondaryLabel =
    variant === "authed" ? "Explorar productos" : "Unirme a la comunidad";

  return (
    <section className="relative mb-10 overflow-hidden rounded-3xl border border-[var(--color-brand-light)] bg-[var(--color-brand-cream)] px-6 py-8 md:mb-14 md:px-8 md:py-10 lg:px-12">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--color-accent-soft)] opacity-60"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
        <div className="max-w-xl text-center lg:text-left">
          <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold italic text-[var(--color-brown)] md:text-3xl">
            Escaneá. Valorá. Colaborá.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-neutral)]">
            Ayudá a la comunidad a descubrir alimentos seguros. Escaneá el código de barras
            de cualquier producto para ver su puntuación o dejar tu propia evaluación.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <Button
              asChild
              variant="inverted"
              size="lg"
              className="w-full gap-2 uppercase tracking-wide sm:w-auto"
            >
              <Link href="/productos/nuevo">
                <QrCode className="h-5 w-5" />
                Abrir scanner
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full uppercase tracking-wide sm:w-auto"
            >
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          </div>
        </div>
        <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border border-[var(--color-border)] bg-white shadow-sm md:h-36 md:w-36">
          <Award className="h-12 w-12 text-[var(--color-primary)]" />
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">
            Tier Oro
          </p>
        </div>
      </div>
    </section>
  );
}
