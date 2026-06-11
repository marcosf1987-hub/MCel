import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Instagram, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="hidden md:flex md:flex-wrap md:items-center md:justify-between md:gap-6 md:pb-6">
          <div>
            <p className="font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-brown)]">
              Celíacos AR
            </p>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-muted-foreground)]">
              Comunidad argentina de productos sin gluten evaluados por celíacos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Redes
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 opacity-60"
              disabled
              title="Próximamente"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" disabled title="Próximamente">
              <Mail className="h-4 w-4" />
              Suscribite al newsletter
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-brand-light)] bg-[var(--color-brand-cream)] px-3 py-2 text-[7px] leading-snug text-[var(--color-brown)] md:text-[8px]">
          <strong>Aviso médico:</strong> La información en este sitio proviene de la
          experiencia de la comunidad celíaca y no reemplaza el consejo de un médico o
          nutricionista. Verificá siempre las etiquetas y certificaciones oficiales antes
          de consumir un producto.
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link
            href="/privacidad"
            className="text-[7px] text-[var(--color-neutral)] hover:text-[var(--color-accent)] hover:underline md:text-[8px]"
          >
            Privacidad
          </Link>
        </div>
        <p className="mt-2 text-[6px] leading-snug text-[var(--color-muted-foreground)] md:text-[7px]">
          © {new Date().getFullYear()} Celíacos AR — Comunidad de productos sin gluten
        </p>
      </div>
    </footer>
  );
}
