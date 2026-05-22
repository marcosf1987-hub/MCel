import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-[var(--color-brand-light)] bg-[var(--color-brand-cream)] p-4 text-sm text-[var(--color-brown)]">
          <strong>Aviso médico:</strong> La información en este sitio proviene de la
          experiencia de la comunidad celíaca y no reemplaza el consejo de un médico o
          nutricionista. Verificá siempre las etiquetas y certificaciones oficiales antes
          de consumir un producto.
        </div>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--color-neutral)]">
          <Link href="/privacidad" className="hover:text-[var(--color-accent)] hover:underline">
            Privacidad
          </Link>
          <Link href="/productos" className="hover:text-[var(--color-accent)] hover:underline">
            Productos
          </Link>
          <Link href="/marcas" className="hover:text-[var(--color-accent)] hover:underline">
            Marcas
          </Link>
        </div>
        <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
          © {new Date().getFullYear()} Celíacos AR — Comunidad de productos sin gluten
        </p>
      </div>
    </footer>
  );
}
