import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session-profile";
import {
  canAssignRoles,
  canManageCatalog,
  canManageUsers,
  canModerateContent,
} from "@/lib/auth/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const supabase = await createClient();
  const auth = await requireRole(supabase, "moderator");
  if (!auth.ok) return null;

  const role = auth.session.profile.app_role;

  const [
    { count: usersCount },
    { count: productsCount },
    { count: reviewsCount },
    { count: pendingReports },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const permissions = [
    { label: "Moderar contenido y reportes", enabled: canModerateContent(role) },
    { label: "Gestionar catálogo (productos)", enabled: canManageCatalog(role) },
    { label: "Gestionar usuarios", enabled: canManageUsers(role) },
    { label: "Asignar roles", enabled: canAssignRoles(role) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[var(--color-brown)]">
          Resumen
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Fase A: roles, permisos y base de auditoría. Los módulos de moderación y KPIs
          llegan en las siguientes fases.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-[var(--color-brown)]">
              {usersCount ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Productos activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-[var(--color-brown)]">
              {productsCount ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Evaluaciones activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-[var(--color-brown)]">
              {reviewsCount ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Reportes pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-[var(--color-primary)]">
              {pendingReports ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card id="proximo">
        <CardHeader>
          <CardTitle>Tus permisos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {permissions.map((p) => (
              <li key={p.label} className="flex items-center gap-2">
                <span
                  className={
                    p.enabled
                      ? "text-emerald-700"
                      : "text-[var(--color-muted-foreground)]"
                  }
                >
                  {p.enabled ? "✓" : "—"}
                </span>
                <span className={p.enabled ? "text-[var(--color-brown)]" : "text-[var(--color-muted-foreground)]"}>
                  {p.label}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
            Para asignarte como superadmin, ejecutá la migración 013 y luego el UPDATE
            comentado al final del SQL con tu email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
