import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Instagram, Mail } from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/celiappok";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between md:gap-6 md:pb-6">
          <div>
            <p className="font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-brown)]">
              CeliApp
            </p>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-muted-foreground)]">
              Comunidad argentina de productos sin gluten evaluados por celíacos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Redes
            </span>
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-9 w-9"
              title="Instagram"
            >
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de CeliApp"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled
              title="Próximamente"
            >
              <Mail className="h-4 w-4" />
              Suscribite al newsletter
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-brand-light)] bg-[var(--color-brand-cream)] px-3 py-2.5 text-[11px] leading-relaxed text-[var(--color-brown)] md:text-[10px]">
          <strong>Aviso médico:</strong> La información en este sitio proviene de
          la experiencia de la comunidad celíaca y no reemplaza el consejo de un
          médico o nutricionista. Verificá siempre las etiquetas y
          certificaciones oficiales antes de consumir un producto.
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Link
            href="/privacidad"
            className="text-[11px] text-[var(--color-neutral)] hover:text-[var(--color-accent)] hover:underline md:text-[10px]"
          >
            Privacidad
          </Link>
          <p className="text-[11px] leading-snug text-[var(--color-muted-foreground)] md:text-[10px]">
            © {new Date().getFullYear()} CeliApp — Comunidad de productos sin
            gluten
          </p>
        </div>
      </div>
    </footer>
  );
}
