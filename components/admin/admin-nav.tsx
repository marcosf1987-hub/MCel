"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, Shield, X } from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
};

const MOBILE_PRIMARY = new Set(["Resumen", "Reportes", "Catálogo", "Usuarios"]);

export function AdminNav({
  nav,
  roleLabel,
}: {
  nav: AdminNavItem[];
  roleLabel: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  const mobilePrimary = nav.filter((item) => MOBILE_PRIMARY.has(item.label));
  const mobileExtra = nav.filter((item) => !MOBILE_PRIMARY.has(item.label));

  return (
    <>
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 md:px-4 md:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <Shield className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
            <span className="truncate font-[family-name:var(--font-headline)] font-bold text-[var(--color-brown)]">
              Panel admin
            </span>
            <span className="hidden shrink-0 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:inline">
              {roleLabel}
            </span>
          </div>
          <Link
            href="/"
            className="shrink-0 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Volver a la app
          </Link>
        </div>

        <nav className="mx-auto hidden max-w-6xl gap-4 overflow-x-auto px-4 pb-3 text-sm md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 hover:text-[var(--color-brown)]",
                isActive(item.href)
                  ? "font-semibold text-[var(--color-brown)]"
                  : "text-[var(--color-muted-foreground)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-border)] bg-white/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Navegación admin"
      >
        <div className="mx-auto flex max-w-lg items-stretch">
          {mobilePrimary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2.5 text-[10px] font-medium",
                isActive(item.href)
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)]"
              )}
            >
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
          {mobileExtra.length > 0 && (
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2.5 text-[10px] font-medium text-[var(--color-muted-foreground)]"
            >
              <Menu className="h-4 w-4" />
              Más
            </button>
          )}
        </div>
      </nav>

      {menuOpen && mobileExtra.length > 0 && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
          role="presentation"
        >
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 shadow-lg"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-[var(--color-brown)]">Más opciones</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-full p-1 text-[var(--color-muted-foreground)]"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="space-y-1">
              {mobileExtra.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-sm",
                      isActive(item.href)
                        ? "bg-[var(--color-brand-cream)] font-medium text-[var(--color-brown)]"
                        : "text-[var(--color-muted-foreground)]"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
