import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Music2,
  Twitter,
  Youtube,
} from "lucide-react";

const SOCIAL_PLACEHOLDERS = [
  { label: "Instagram", icon: Instagram },
  { label: "Facebook", icon: Facebook },
  { label: "X / Twitter", icon: Twitter },
  { label: "TikTok", icon: Music2 },
  { label: "YouTube", icon: Youtube },
  { label: "LinkedIn", icon: Linkedin },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="hidden md:flex md:flex-wrap md:items-center md:justify-between md:gap-6 md:pb-6">
          <div>
            <p className="font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--color-brown)]">
              CeliApp
            </p>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-muted-foreground)]">
              Comunidad argentina de productos sin gluten evaluados por celíacos.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="w-full text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Redes
              </span>
              {SOCIAL_PLACEHOLDERS.map(({ label, icon: Icon }) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 opacity-60"
                  disabled
                  title={`${label} — próximamente`}
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
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
          © {new Date().getFullYear()} CeliApp — Comunidad de productos sin gluten
        </p>
      </div>
    </footer>
  );
}
