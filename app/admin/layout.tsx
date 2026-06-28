import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session-profile";
import { APP_ROLE_LABELS, canManageCatalog, canManageUsers } from "@/lib/auth/roles";
import { AdminNav } from "@/components/admin/admin-nav";

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
      <AdminNav nav={nav} roleLabel={roleLabel} />
      <main className="mx-auto max-w-6xl px-3 py-6 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:px-4 md:py-8 md:pb-8">
        {children}
      </main>
    </div>
  );
}
