import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="rounded-xl border border-[var(--color-brand-light)] bg-[var(--color-brand-cream)] px-3 py-2 text-[7px] leading-snug text-[var(--color-brown)] md:text-[8px]">
          <strong>Aviso médico:</strong> La información en este sitio proviene de la
          experiencia de la comunidad celíaca y no reemplaza el consejo de un médico o
          nutricionista. Verificá siempre las etiquetas y certificaciones oficiales antes
          de consumir un producto.
        </div>
        <div className="mt-3">
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
