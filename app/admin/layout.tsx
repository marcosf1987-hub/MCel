import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session-profile";
import { APP_ROLE_LABELS, canManageCatalog, canManageUsers } from "@/lib/auth/roles";
import { Shield } from "lucide-react";

export const metadata = { title: "Administración" };

const BASE_NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/analytics", label: "Métricas" },
  { href: "/admin/reports", label: "Reportes" },
];

const USERS_NAV = [{ href: "/admin/users", label: "Usuarios" }];

const CATALOG_NAV = [
  { href: "/admin/catalog", label: "Catálogo" },
  { href: "/admin/images", label: "Imágenes" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const auth = await requireRole(supabase, "moderator");

  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      redirect("/login?returnUrl=/admin");
    }
    if (auth.reason === "suspended") {
      redirect("/login?error=Cuenta%20suspendida");
    }
    redirect("/?error=sin_permisos_admin");
  }

  const roleLabel = APP_ROLE_LABELS[auth.session.profile.app_role];
  const nav = [
    ...BASE_NAV,
    ...(canManageUsers(auth.session.profile.app_role) ? USERS_NAV : []),
    ...(canManageCatalog(auth.session.profile.app_role) ? CATALOG_NAV : []),
  ];

  return (
    <div className="min-h-screen bg-[var(--color-brand-cream)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--color-primary)]" />
            <span className="font-[family-name:var(--font-headline)] font-bold text-[var(--color-brown)]">
              Panel admin
            </span>
            <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {roleLabel}
            </span>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Volver a la app
          </Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 pb-3 text-sm">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="shrink-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-brown)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
