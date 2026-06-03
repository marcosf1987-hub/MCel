"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, Heart, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  accent?: boolean;
};

const items: NavItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/productos/nuevo", label: "Cargar", icon: PlusCircle, accent: true },
  { href: "/cuenta/listas/mis-favoritos", label: "Favoritos", icon: Heart },
  { href: "/cuenta/preferencias", label: "Cuenta", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegación principal"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {items.map(({ href, label, icon: Icon, accent }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);

          if (accent) {
            return (
              <li key={href} className="flex flex-1 justify-center">
                <Link
                  href={href}
                  className="flex -mt-4 flex-col items-center gap-0.5"
                  aria-label="Escanear o cargar producto"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-md">
                    <Icon className="h-7 w-7" />
                  </span>
                  <span className="text-[10px] font-medium text-[var(--color-brown)]">
                    {label}
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)]"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    active && "bg-[var(--color-primary)] text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
